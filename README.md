# Farm Multi Nodeverse

Tự động hóa quá trình farming trong Nodeverse với nhiều tài khoản và proxy.

## 1. Chuẩn Bị Môi Trường

### 1.1 Login user (nodeerse)

Đăng nhập vào tài khoản `nodeerse` (nếu cần):
```bash
su - nodeerse
```

### 1.2 Clone repository

```bash
git clone https://github.com/q18element/farm_multi_nodeverse
cd farm_multi_nodeverse
```

### 1.3 Cài đặt các phụ thuộc

```bash
npm install
```

## 2. Kiểm Tra & Cài Đặt Chromium và Chromedriver

### 2.1 Kiểm tra phiên bản Chromium

```bash
chromium --version
```
Nếu chưa cài đặt, hãy chạy:
```bash
sudo apt install chromium-browser
```

### 2.2 Kiểm tra và cài đặt Chromedriver

```bash
chromedriver --version
```
Nếu chưa cài đặt, hãy chạy:
```bash
sudo apt install chromium-chromedriver
```

### 2.3 Đảm bảo đường dẫn đúng

Kiểm tra đường dẫn:
```bash
which chromium
which chromedriver
```
Đảm bảo kết quả trả về là `/usr/bin/chromium` và `/usr/bin/chromedriver`.

## 3. Cấu Hình

### 3.1 Cấu hình tài khoản

Chỉnh sửa file `input/accounts.csv` theo định dạng `username,password,seedphrase,services,profile_volume`, ví dụ:

username: Username của tài khoản(email), không được trùng với cái account khác
password: Password của tài khoản
seedphrase: Seedphrase của tài khoản dùng để log in các ví Metamask, Kepler, ... dùng 12 seed pharse
services: Các service bằng dạng "gradient bless toggle openloop" (phân cách bởi dấu phân cách)
profile_volume: Số profile chạy của account () mỗi profile sẽ tự động gán proxy từ file đã cung cấpcấp

Mở bằng nano:
```bash
nano input/accounts.csv
```

Hoặc dùng excel để chính sửa file `input/accounts.csv`:

### 3.2 Cấu hình proxy

Chỉnh sửa file `input/proxy.csv` theo định dạng `username:password@ip:port`, ví dụ:
```
proxyuser:proxypass@192.168.1.10:3128
```
Mở bằng nano:
```bash
nano input/proxy.csv
```
Hoặc dùng excel để chính sửa file `input/proxy.csv`:


## 4. Chạy Ứng Dụng
Ứng dụng sẽ chạy theo dữ liệu được cung cấp trong input/accounts.csv
```typescript
npm run node --loader ts-node/esm app.ts
```

<!-- ### 4.1 Trường hợp **chạy lần đầu** hoặc muốn bắt đầu từ zero

- **Reset DB**, xoá profiles, **gán proxy**, và **chạy toàn bộ service**:
  ```bash
  node app.js --reset --proxy --services gradient toggle bless openloop blockmesh despeed depined
  ```
  Lệnh trên sẽ:
  - Reset lại DB và xoá tất cả profile cũ (nếu có).
  - Đọc file `proxy.txt` và `accounts.txt` để gán proxy cho tài khoản.
  - Chạy **toàn bộ** các service (được liệt kê sau tham số `--services`). -->

<!-- ### 4.2 Trường hợp **đã có** profiles và **chỉ muốn chạy lại** với cấu hình cũ

- **Không** cần reset DB (để giữ lại profile cũ), **vẫn gán proxy** (hoặc không):
  ```bash
  # Giữ nguyên profile cũ, vẫn gán proxy
  node app.js --proxy --services bless openloop
  ```
  Hoặc:
  ```bash
  # Giữ nguyên profile cũ, bỏ qua bước gán proxy
  node app.js --services bless openloop
  ```
  (Trường hợp này yêu cầu bạn đã gán proxy từ trước.)

Trong cả hai cách trên, DB sẽ **không** bị xoá và các profile cũ vẫn còn. Ứng dụng sẽ tiếp tục chạy kiểm tra/farm theo cấu hình hiện tại.

### 4.3 Tham số `--services`

Bạn có thể chỉ định bất kỳ service nào (một hoặc nhiều), ví dụ:
```bash
node app.js --services gradient toggle
```
hoặc
```bash
node app.js --services bless openloop depined
```
Nếu không truyền `--services`, ứng dụng sẽ báo lỗi vì **cần** biết phải chạy service nào. -->

## 5. Lưu Ý

- Bảo đảm **Chromium** và **Chromedriver** khớp phiên bản, nếu không có thể xảy ra lỗi lúc chạy tự động.
- Khi sử dụng `--reset`, tất cả dữ liệu và folder `profiles` sẽ bị **xoá** — chỉ dùng khi muốn chạy lại từ đầu.
- Nếu đã có profile và DB (chứa thông tin đăng nhập, proxy, v.v.) thì có thể bỏ qua `--reset`. Chỉ cần gọi `--services` (và tùy chọn `--proxy` nếu muốn cập nhật/gán mới).