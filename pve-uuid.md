# 使用 UUID 在 PVE 中挂载磁盘

在 Proxmox VE (PVE) 中，UUID 挂载通常用于持久化存储设备的挂载，避免因设备名（如 `/dev/sdb1`）变化而导致挂载失败。以下是使用 UUID 在 PVE 中挂载磁盘的步骤：

---

### **1. 查看磁盘的 UUID**
```bash
lsblk -f
# 或
blkid
```
输出示例：
```
/dev/sdb1: UUID="a1b2c3d4-e5f6-7890-abcd-ef1234567890" TYPE="ext4"
```

---

### **2. 创建挂载点目录**
```bash
mkdir /mnt/mystorage
```

---

### **3. 临时挂载（重启后失效）**
```bash
mount UUID="a1b2c3d4-e5f6-7890-abcd-ef1234567890" /mnt/mystorage
# 或
mount /dev/sdb1 /mnt/mystorage
```

---

### **4. 永久挂载（修改 /etc/fstab）**
编辑 `/etc/fstab`：
```bash
nano /etc/fstab
```
添加一行：
```bash
UUID=a1b2c3d4-e5f6-7890-abcd-ef1234567890 /mnt/mystorage ext4 defaults 0 0
```
**说明**：
- 格式：`UUID=<实际UUID> <挂载点> <文件系统类型> <挂载选项> <dump> <fsck顺序>`
- 如果文件系统是 `xfs`、`ntfs` 等，需对应修改。

---

### **5. 测试并应用**
```bash
# 测试 fstab 配置是否正确
mount -a

# 查看是否挂载成功
df -h
lsblk
```

---

### **6. 在 PVE 中添加存储（可选）**
如果要将该磁盘作为 PVE 的存储（存放虚拟机镜像等）：
1. **通过 Web 界面**：
   - 点击数据中心 → 存储 → 添加 → 目录
   - ID：自定义名称（如 `mystorage`）
   - 目录：`/mnt/mystorage`
   - 其他选项按需选择

2. **通过命令行**：
   ```bash
   pvesm add dir mystorage --path /mnt/mystorage --content images,iso
   ```

---

### **注意事项**
- **文件系统**：确保磁盘已格式化（如 `mkfs.ext4 /dev/sdb1`）。
- **权限**：确保 PVE 用户（如 `www-data`）有访问权限。
- **NFS/CIFS 挂载**：如果是网络存储，可直接在 PVE 存储中添加 NFS/CIFS，无需手动挂载到 `/etc/fstab`。
- **LVM/ZFS**：如果磁盘已用于 LVM 或 ZFS，应通过 PVE 的 LVM/ZFS 存储类型添加，而非直接挂载目录。

---

### **示例：挂载 ext4 磁盘到 PVE 存储**
```bash
# 查看 UUID
blkid /dev/sdb1

# 创建挂载点
mkdir /pve/storage1

# 编辑 /etc/fstab
echo "UUID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx /pve/storage1 ext4 defaults 0 0" >> /etc/fstab

# 挂载
mount -a

# 添加为 PVE 存储
pvesm add dir storage1 --path /pve/storage1 --content vztmpl,backup,iso,images
```

---

通过以上步骤，你可以可靠地基于 UUID 挂载磁盘到 PVE 中。

## usb 硬盘挂载增强
```shell
#!/bin/bash
# /usr/local/bin/usb-stability-enhanced.sh
# 增强版USB稳定性检查脚本

set -euo pipefail  # 严格模式：遇到错误退出、未定义变量报错、管道失败报错

# ============== 配置区域 ==============
# 以下配置可根据实际环境直接修改

# USB 挂载点目录
BACKUP_DIR="/mnt/sdd1"

# 日志文件路径
LOG_FILE="/var/log/usb-stability.log"

# 最大重试次数
MAX_RETRIES=3

# 重试间隔（秒）
RETRY_DELAY=5

# 连续失败多少次触发告警
ALERT_THRESHOLD=3

# Bark 推送配置（修改成你自己的推送 key）
BARK_URL="https://api.day.app/F8JC4vqJFfsNJNKL2tmhHV"
# 推送频率限制（秒），默认 30 分钟内不重复推送相同类型的消息
BARK_COOLDOWN=60

# 内部配置（一般无需修改）
LOCK_FILE="/tmp/usb-stability.lock"
COUNTER_FILE="/tmp/usb-failure-count"
RUN_COUNT_FILE="/tmp/usb-stability-run-count"
NOTIFICATION_LAST_TIME_FILE="/tmp/usb-notification-time"

# ============== 必需命令检查 ==============
check_required_commands() {
    local missing=()
    for cmd in findmnt lsblk mount umount grep logger df curl; do
        if ! command -v "$cmd" &>/dev/null; then
            missing+=("$cmd")
        fi
    done
    if [ ${#missing[@]} -gt 0 ]; then
        echo "错误: 缺少必需命令: ${missing[*]}" >&2
        exit 1
    fi
}

# ============== root 权限检查 ==============
check_root() {
    if [ "$EUID" -ne 0 ]; then
        echo "错误: 此脚本需要 root 权限运行" >&2
        exit 1
    fi
}

# ============== 清理函数 ==============
cleanup() {
    rm -f "$LOCK_FILE"
    # 退出时记录
    log "脚本退出"
}

# ============== 锁机制（使用 flock） ==============
acquire_lock() {
    exec 200>"$LOCK_FILE"
    if ! flock -n 200; then
        echo "错误: 另一个实例正在运行" >&2
        exit 1
    fi
    # 设置陷阱，确保退出时释放锁
    trap cleanup EXIT
}

# ============== 日志函数 ==============
log() {
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local message="$timestamp - $*"

    # 输出到控制台（检查 stdout 是否为终端）
    if [ -t 1 ]; then
        echo "$message"
    fi

    # 写入日志文件
    echo "$message" >> "$LOG_FILE"

    # 写入系统日志
    logger -t "USB-Stability" "$*"
}

# ============== 发送通知 ==============
send_notification() {
    local title="$1"
    local message="$2"
    local notify_type="${3:-error}"  # error/retry/success
    local max_count=3  # 冷却时间内最多发送次数

    # 写入告警日志
    echo "$(date '+%Y-%m-%d %H:%M:%S'): $title - $message" >> "/tmp/usb-alerts.log"

    # 频率控制：60秒内最多发送3次
    local current_time=$(date +%s)
    local time_file="${NOTIFICATION_LAST_TIME_FILE}.${notify_type}"

    # 从文件读取：上次发送时间|已发送次数
    local last_send_time=0
    local send_count=0
    if [ -f "$time_file" ]; then
        local data=$(cat "$time_file" 2>/dev/null)
        last_send_time=$(echo "$data" | cut -d'|' -f1)
        send_count=$(echo "$data" | cut -d'|' -f2)
    fi

    local time_since_last_send=$((current_time - last_send_time))

    # 如果距离上次发送不足冷却时间
    if [ "$time_since_last_send" -lt "$BARK_COOLDOWN" ]; then
        # 检查是否已达最大次数
        if [ "$send_count" -ge "$max_count" ]; then
            log "推送频率限制: 60秒内已发送 ${send_count}/${max_count} 次，跳过本次 ${notify_type} 通知"
            return 0
        fi
        # 未达最大次数，增加计数
        send_count=$((send_count + 1))
    else
        # 超过冷却时间，重置计数
        send_count=1
    fi

    # 发送 Bark 推送（使用 curl 的 --data-urlencode 正确处理中文）
    local response
    local http_code

    response=$(curl -s -G \
        --data-urlencode "title=$title" \
        --data-urlencode "body=$message" \
        -w "\n%{http_code}" \
        "$BARK_URL" 2>&1)
    http_code=$(echo "$response" | tail -1)
    response_body=$(echo "$response" | head -1)

    if [ "$http_code" = "200" ]; then
        log "✅ 推送成功: $title (60秒内第 $send_count/${max_count} 次)"
        # 记录推送时间和次数
        echo "${current_time}|${send_count}" > "$time_file"
    else
        log "⚠️ 推送失败: HTTP $http_code - $response_body"
        # 记录失败详情到单独的日志
        echo "$(date '+%Y-%m-%d %H:%M:%S'): TITLE=$title, MESSAGE=$message, HTTP_CODE=$http_code, RESPONSE=$response_body" >> "/tmp/usb-push-errors.log"
    fi
}

# ============== 原子操作：计数器管理 ==============
get_counter() {
    local file="$1"
    if [ -f "$file" ]; then
        cat "$file" 2>/dev/null || echo "0"
    else
        echo "0"
    fi
}

increment_counter() {
    local file="$1"
    local current=$(( $(get_counter "$file") + 1 ))
    echo "$current" > "$file"
    echo "$current"
}

reset_counter() {
    echo "0" > "$1"
}

# ============== 检查USB设备是否存在 ==============
check_usb_device() {
    if ! mountpoint -q "$BACKUP_DIR"; then
        return 1
    fi

    local device
    device=$(findmnt -n -o SOURCE "$BACKUP_DIR" 2>/dev/null)
    if [ -z "$device" ]; then
        return 1
    fi

    # 检查设备是否为USB设备
    local transport
    transport=$(lsblk -dno TRAN "$device" 2>/dev/null)
    if [ "$transport" = "usb" ]; then
        log "USB设备正常: $device"
        return 0
    fi

    return 1
}

# ============== 获取USB设备信息 ==============
get_usb_info() {
    if ! mountpoint -q "$BACKUP_DIR"; then
        echo "设备未挂载"
        return 1
    fi

    local device
    device=$(findmnt -n -o SOURCE "$BACKUP_DIR" 2>/dev/null)

    local df_output
    df_output=$(df -h "$BACKUP_DIR" | tail -1)
    local size=$(echo "$df_output" | awk '{print $2}')
    local used=$(echo "$df_output" | awk '{print $5}')
    local available=$(echo "$df_output" | awk '{print $4}')

    cat <<EOF
设备: $device
大小: $size
使用率: $used
可用: $available
EOF
}

# ============== 查找USB块设备 ==============
find_usb_block_device() {
    # 方法1: 通过 lsblk 查找 USB 传输类型的块设备
    local device
    device=$(lsblk -dno NAME,TRAN | awk '$2 == "usb" {print "/dev/" $1; exit}')
    if [ -n "$device" ] && [ -b "$device" ]; then
        echo "$device"
        return 0
    fi

    # 方法2: 查找 by-id 中的 USB 设备（排除分区）
    for dev in /dev/disk/by-id/*usb*; do
        if [ -e "$dev" ]; then
            # 解析到实际设备路径，并获取基础设备（非分区）
            local real_dev
            real_dev=$(readlink -f "$dev")
            # 如果是分区（如 sdd1），获取基础设备（sdd）
            local base_dev="${real_dev%%[0-9]}"
            if [ -b "$base_dev" ]; then
                echo "$base_dev"
                return 0
            fi
        fi
    done

    return 1
}

# ============== 挂载USB设备 ==============
mount_usb_device() {
    local device="$1"

    # 尝试挂载设备（可能是基础设备，尝试挂载第一个分区）
    if mount "$device" "$BACKUP_DIR" 2>> "$LOG_FILE"; then
        return 0
    fi

    # 尝试挂载第一个分区
    local partition="${device}1"
    if [ -b "$partition" ]; then
        if mount "$partition" "$BACKUP_DIR" 2>> "$LOG_FILE"; then
            return 0
        fi
    fi

    return 1
}

# ============== 设置IO调度器 ==============
set_io_scheduler() {
    local device="$1"
    local block_device

    # 获取块设备名称（去掉分区号）
    block_device=$(basename "$(readlink -f "$device")" | sed 's/[0-9]*$//')

    local scheduler_path="/sys/block/$block_device/queue/scheduler"
    if [ -w "$scheduler_path" ]; then
        echo "deadline" > "$scheduler_path" 2>/dev/null && \
            log "已设置I/O调度器为deadline: $block_device"
    fi
}

# ============== 主检查函数 ==============
check_and_fix_mount() {
    log "=== 开始USB挂载状态检查 ==="

    # 1. 检查并创建挂载点
    if [ ! -d "$BACKUP_DIR" ]; then
        log "创建挂载点目录: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
    fi

    # 2. 检查当前挂载状态
    if mountpoint -q "$BACKUP_DIR"; then
        # 挂载正常，检查是否可写
        local test_file="$BACKUP_DIR/.mount-test-$(date +%s)"
        if touch "$test_file" 2>/dev/null; then
            rm -f "$test_file"
            log "✅ USB挂载正常且可写"

            # 获取详细信息
            local info
            info=$(get_usb_info)
            log "磁盘信息:\n$info"

            # 重置失败计数器
            local prev_count
            prev_count=$(get_counter "$COUNTER_FILE")
            if [ "$prev_count" -gt 0 ]; then
                log "恢复成功，重置失败计数器（之前失败 $prev_count 次）"
                send_notification "✅ USB磁盘恢复" "USB磁盘已恢复挂载，之前失败 $prev_count 次" "success"
            fi
            reset_counter "$COUNTER_FILE"
            return 0
        else
            log "警告: 挂载点存在但不可写，尝试重新挂载"
            umount -l "$BACKUP_DIR" 2>/dev/null || true
        fi
    else
        log "USB未挂载，开始挂载流程"
    fi

    # 3. 尝试挂载（最多重试 MAX_RETRIES 次）
    local success=false

    for ((i=1; i<=MAX_RETRIES; i++)); do
        log "挂载尝试 $i/$MAX_RETRIES"

        # 清理旧的挂载
        if grep -qs "$BACKUP_DIR" /proc/mounts; then
            log "清理旧的挂载"
            umount -l "$BACKUP_DIR" 2>/dev/null || true
            sleep 2
        fi

        # 方法1: 通过 fstab 挂载
        if mount -a 2>> "$LOG_FILE" && mountpoint -q "$BACKUP_DIR"; then
            log "✅ 通过 mount -a 挂载成功"
            success=true
            break
        fi

        # 方法2: 查找并直接挂载 USB 设备
        local usb_device
        usb_device=$(find_usb_block_device)
        if [ -n "$usb_device" ]; then
            log "尝试直接挂载USB设备: $usb_device"
            if mount_usb_device "$usb_device" && mountpoint -q "$BACKUP_DIR"; then
                log "✅ 直接挂载成功"
                success=true
                break
            fi
        fi

        if [ $i -lt $MAX_RETRIES ]; then
            log "挂载失败，等待 ${RETRY_DELAY}秒后重试"
            # 发送重试通知（只在第1次重试时发送）
            if [ $i -eq 1 ]; then
                send_notification "🔄 USB挂载重试中" "正在第 ${i}/${MAX_RETRIES} 次重试挂载..." "retry"
            fi
            sleep "$RETRY_DELAY"
        fi
    done

    # 4. 检查结果
    if [ "$success" = true ]; then
        log "✅ 挂载成功"

        # 如果之前有失败记录，发送重试成功通知
        local prev_count
        prev_count=$(get_counter "$COUNTER_FILE")
        if [ "$prev_count" -gt 0 ]; then
            send_notification "✅ USB挂载成功" "经过重试后成功挂载（之前失败 $prev_count 次）" "success"
        fi

        # 挂载后优化
        local device
        device=$(findmnt -n -o SOURCE "$BACKUP_DIR" 2>/dev/null)
        if [ -n "$device" ]; then
            set_io_scheduler "$device"
        fi

        # 重启相关服务（如果存在）
        if systemctl list-unit-files | grep -q pvedaemon; then
            log "重启PVE相关服务"
            systemctl restart pvedaemon pveproxy 2>> "$LOG_FILE" || true
        fi

        reset_counter "$COUNTER_FILE"
        return 0
    else
        # 所有尝试都失败
        local failure_count
        failure_count=$(increment_counter "$COUNTER_FILE")
        log "❌ 错误: 经过 $MAX_RETRIES 次尝试仍无法挂载USB磁盘"
        log "连续失败次数: $failure_count"

        # 检查USB设备是否物理存在
        if lsusb 2>/dev/null | grep -q "Mass Storage"; then
            log "USB存储设备在系统中可见，但无法挂载"
        else
            log "警告: 系统中未检测到USB存储设备"
        fi

        # 如果连续失败达到阈值，发送告警
        if [ "$failure_count" -ge "$ALERT_THRESHOLD" ]; then
            send_notification "❌ USB磁盘挂载失败" "USB磁盘连续 $failure_count 次挂载失败，请立即检查！" "error"
        fi

        return 1
    fi
}

# ============== USB优化 ==============
optimize_usb() {
    # 禁用USB自动挂起
    for device in /sys/bus/usb/devices/*/power/control; do
        [ -f "$device" ] && echo "on" > "$device" 2>/dev/null
    done

    # 增加USB存储超时
    if [ -f /sys/module/usb_storage/parameters/delay_use ]; then
        echo "30" > /sys/module/usb_storage/parameters/delay_use 2>/dev/null
    fi

    log "USB优化已应用"
}

# ============== 清理旧日志 ==============
cleanup_logs() {
    # 保留最近7天的日志
    find /var/log -name "usb-*.log" -type f -mtime +7 -delete 2>/dev/null || true
    # 清理临时测试文件
    find "$BACKUP_DIR" -name ".mount-test-*" -type f -mtime +1 -delete 2>/dev/null || true
}

# ============== 主函数 ==============
main() {
    # 初始化
    check_required_commands
    check_root
    acquire_lock

    # 执行清理
    cleanup_logs

    # 执行优化（每10次执行一次）
    local run_count
    run_count=$(get_counter "$RUN_COUNT_FILE")
    if [ $((run_count % 10)) -eq 0 ] && [ "$run_count" -gt 0 ]; then
        optimize_usb
    fi
    increment_counter "$RUN_COUNT_FILE" > /dev/null

    # 执行主要检查
    local exit_code=0
    check_and_fix_mount || exit_code=$?

    log "=== 检查完成 ==="

    return $exit_code
}

# ============== 运行主函数 ==============
main "$@"
```