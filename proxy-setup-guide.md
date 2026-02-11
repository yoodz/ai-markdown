# Xray 代理配置指南

本文档记录如何在 Linux 系统上配置 Xray 代理，以便访问 Google 和 Brave Search API。

## 环境信息

- **操作系统**: Ubuntu/Debian Linux
- **代理协议**: Trojan
- **安装路径**: `~/.local/bin/xray`
- **配置路径**: `~/.config/xray/`

## 一、安装 Xray

### 1. 下载 Xray

```bash
cd /tmp
wget https://github.com/XTLS/Xray-core/releases/download/v1.8.6/Xray-linux-64.zip
unzip -q Xray-linux-64.zip -d xray
```

### 2. 安装到用户目录

```bash
mkdir -p ~/.local/bin ~/.config/xray
cp /tmp/xray/xray ~/.local/bin/
chmod +x ~/.local/bin/xray
cp /tmp/xray/*.dat ~/.config/xray/
```

## 二、获取订阅信息

从 VPN 服务商获取订阅地址，格式类似：

```
https://<UUID>.com/<path>?token=<YOUR_TOKEN>
```

### 解析订阅内容

```bash
# 获取订阅内容（Base64 编码）
curl -s "https://<SUBSCRIPTION_URL>" | base64 -d

# 解码后会看到 Trojan 链接，格式：
# trojan://<PASSWORD>@<SERVER>:<PORT>?sni=<SNI>#<REMARK>
```

## 三、配置 Xray

### 1. 创建配置文件

编辑 `~/.config/xray/config.json`：

```json
{
  "log": {
    "loglevel": "warning"
  },
  "inbounds": [
    {
      "tag": "socks",
      "port": 10808,
      "listen": "127.0.0.1",
      "protocol": "socks",
      "sniffing": {
        "enabled": true,
        "destOverride": ["http", "tls"]
      },
      "settings": {
        "auth": "noauth",
        "udp": true
      }
    },
    {
      "tag": "http",
      "port": 10809,
      "listen": "127.0.0.1",
      "protocol": "http"
    }
  ],
  "outbounds": [
    {
      "tag": "proxy",
      "protocol": "trojan",
      "settings": {
        "servers": [
          {
            "address": "<SERVER_ADDRESS>",      // 例如：d2.cat***.com
            "port": <PORT>,                   // 例如：9125
            "password": "<YOUR_PASSWORD>",     // Trojan 密码
            "sni": "<SNI>"                  // 例如：hk.cat***.com
          }
        ]
      },
      "streamSettings": {
        "network": "tcp",
        "security": "tls",
        "tlsSettings": {
          "allowInsecure": true,
          "serverName": "<SNI>"
        }
      }
    },
    {
      "tag": "direct",
      "protocol": "freedom"
    }
  ],
  "routing": {
    "domainStrategy": "AsIs",
    "rules": [
      {
        "type": "field",
        "domain": ["google.com", "api.search.brave.com", "www.google.com"],
        "outboundTag": "proxy"
      }
    ]
  }
}
```

**注意**：
- 将 `<SERVER_ADDRESS>` 替换为实际节点地址
- 将 `<PORT>` 替换为实际端口
- 将 `<YOUR_PASSWORD>` 替换为 Trojan 密码
- 将 `<SNI>` 替换为 SNI 值

### 2. 创建启动脚本

创建 `~/.config/xray/start-xray.sh`：

```bash
#!/bin/bash
# Xray Proxy 启动脚本

XRAY_BIN="/home/ai/.local/bin/xray"
XRAY_CONFIG="/home/ai/.config/xray/config.json"
PID_FILE="/tmp/xray.pid"

# 检查是否已经在运行
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "Xray is already running (PID: $PID)"
        exit 0
    else
        rm "$PID_FILE"
    fi
fi

# 启动 xray
$XRAY_BIN run -config "$XRAY_CONFIG" > /tmp/xray.log 2>&1 &
echo $! > "$PID_FILE"

echo "Xray started successfully"
echo "SOCKS5 proxy: 127.0.0.1:10808"
echo "HTTP proxy: 127.0.0.1:10809"
```

```bash
chmod +x ~/.config/xray/start-xray.sh
```

## 四、启动代理

```bash
# 启动代理
bash ~/.config/xray/start-xray.sh

# 查看日志
tail -f /tmp/xray.log

# 检查进程
ps aux | grep xray
```

## 五、使用代理

### 1. 命令行临时使用

```bash
# 使用 SOCKS5 代理
curl -x socks5://127.0.0.1:10808 https://www.google.com

# 使用 HTTP 代理
curl -x http://127.0.0.1:10809 https://www.google.com

# 测试 Brave Search API
curl -x http://127.0.0.1:10809 \
  "https://api.search.brave.com/res/v1/web/search?q=test" \
  -H "X-Subscription-Token: <YOUR_BRAVE_API_KEY>"
```

### 2. 设置环境变量

```bash
# 临时（当前会话）
export http_proxy=http://127.0.0.1:10809
export https_proxy=http://127.0.0.1:10809

# 永久（添加到 ~/.bashrc 或 ~/.zshrc）
echo 'export http_proxy=http://127.0.0.1:10809' >> ~/.bashrc
echo 'export https_proxy=http://127.0.0.1:10809' >> ~/.bashrc
```

### 3. 配置 OpenClaw Gateway

如果要在 OpenClaw 中使用代理，重启 Gateway 时会自动使用环境变量：

```bash
# 设置代理
export http_proxy=http://127.0.0.1:10809
export https_proxy=http://127.0.0.1:10809

# 重启 OpenClaw Gateway
openclaw gateway restart
```

## 六、验证配置

```bash
# 测试 Google
curl -x http://127.0.0.1:10809 https://www.google.com -I

# 测试 Brave Search API
curl -x http://127.0.0.1:10809 \
  "https://api.search.brave.com/res/v1/web/search?q=test&count=1" \
  -H "X-Subscription-Token: <YOUR_BRAVE_API_KEY>" \
  | head -50
```

## 七、管理命令

```bash
# 启动
bash ~/.config/xray/start-xray.sh

# 停止
killall xray

# 查看日志
cat /tmp/xray.log

# 检查状态
ps aux | grep xray
```

## 八、路由规则说明

配置中的路由规则会自动决定流量走向：

- **走代理的域名**：`google.com`, `api.search.brave.com`, `www.google.com`
- **其他流量**：直连（通过 `direct` outbound）

可以根据需要添加更多规则：

```json
{
  "type": "field",
  "domain": ["github.com", "api.openai.com", "anthropic.com"],
  "outboundTag": "proxy"
}
```

## 九、故障排查

### 代理无法启动

1. 检查日志：
   ```bash
   cat /tmp/xray.log
   ```

2. 常见错误：
   - `failed to open file: geosite.dat` → 确保数据文件已复制到配置目录
   - `Connection refused` → 检查端口是否被占用

### 无法访问目标站点

1. 确认代理正在运行：
   ```bash
   ps aux | grep xray
   ```

2. 测试本地代理端口：
   ```bash
   curl -v http://127.0.0.1:10809
   ```

3. 检查路由规则是否正确

### 订阅更新

如果 VPN 服务商更新了节点，需要：

1. 重新获取订阅信息
2. 更新 `config.json` 中的节点信息
3. 重启代理：
   ```bash
   killall xray
   bash ~/.config/xray/start-xray.sh
   ```

## 十、安全建议

1. **不要将配置文件提交到公开仓库**：`config.json` 包含敏感信息
2. **使用环境变量管理 API Key**：不要将 API Key 写死在配置中
3. **定期更新 Xray**：关注官方发布的安全更新
4. **使用防火墙规则**：限制代理端口只允许本地访问

## 附录：完整配置示例

### 环境变量配置 (`.env`)

```bash
# Proxy
PROXY_HTTP=127.0.0.1:10809
PROXY_SOCKS=127.0.0.1:10808
export http_proxy=http://$PROXY_HTTP
export https_proxy=http://$PROXY_HTTP
export no_proxy=localhost,127.0.0.1,192.168.31.202

# Brave Search API
BRAVE_SEARCH_API_KEY=<YOUR_BRAVE_API_KEY>
```

### Git 忽略规则 (`.gitignore`)

```
# 敏感配置
config.json
*.key
*.token

# 日志
*.log
/tmp/

# 二进制
xray
```

## 相关资源

- [Xray 官方文档](https://xtls.github.io/)
- [Trojan 协议说明](https://trojan-gfw.github.io/trojan/)
- [Brave Search API](https://brave.com/search/api)

---

**注意**：本文档中的占位符（如 `<YOUR_TOKEN>`）需要替换为实际值。生产环境请务必做好敏感信息的保护。
