FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    build-essential cmake git curl unzip \
    libglfw3-dev libglm-dev libxrandr-dev \
    libxinerama-dev libxi-dev libxcursor-dev \
    libgl1-mesa-dev pkg-config

WORKDIR /app

COPY . .

RUN chmod +x setup.sh && ./setup.sh

CMD ["./build/shadowrealm"]
