# 生产阶段 - 使用 nginx 提供静态文件
FROM nginx:alpine

ENV TZ=Asia/Shanghai

# 删除 nginx 默认配置
RUN rm -rf /usr/share/nginx/html/*

# 复制已构建好的静态文件（由 GitHub Actions 或本地构建）
COPY .vitepress/dist /usr/share/nginx/html

# 复制自定义 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
