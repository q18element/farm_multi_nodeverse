# 🌾 Farm Multi Nodeverse

Tự động hóa quá trình farming trong Nodeverse với nhiều tài khoản và proxy.

---

## Các dự án đang support

### FARMING

<table border="1" cellpadding="5" cellspacing="0" style="width: 100%">
  <tr>
    <th>Project Name</th>
    <th>Yêu cầu</th>
    <th>Cách chạy</th>
    <th>Tên service (sử dụng trong file accounts.csv)</th>
    <th>Note</th>
  </tr>
  <tr>
    <td><b>LayerEdge</b></td>
    <td>Sử dụng seed phrase</td>
    <td><a href="#-3-cấu-hình">🔧 3. Cấu Hình</a></td>
    <td>layeredge</td>
    <td></td>
  </tr>
  <tr>
    <td><b>HaHaWallet</b></td>
    <td>Sử dụng seed phrase</td>
    <td><a href="#-3-cấu-hình">🔧 3. Cấu Hình</a></td>
    <td>hahawallet</td>
    <td></td>
  </tr>
</table>

### TOOL

<table border="1" cellpadding="5" cellspacing="0" style="width: 100%">
  <tr>
    <th>Project Name</th>
    <th>Yêu cầu</th>
    <th>Cách chạy</th>
    <th>Tool</th>
    <th>Note</th>
  </tr>
  <tr>
    <td><b>Zero G(0G)</b></td>
    <td>Sử dụng seed phrase</td>
    <td><a href="./tool/ZERO_G/README.md">ZERO_G README.md</a></td>
    <td>- Faucet OG <br>- Upload File</td>
        <td></td>

  </tr>
</table>

## ⚙️ 1. Chuẩn Bị Môi Trường (Install)

### 1.1 Đăng Nhập User (nodeverse)

- Unknown

### 1.2 Clone Repository

```bash
git clone https://github.com/q18element/farm_multi_nodeverse
cd farm_multi_nodeverse
```

### 1.3 Cài Đặt Project

```bash
npm install typescript --save-dev
```

```bash
npm install
```

## 🌐 2. Kiểm Tra & Cài Đặt Chromium và Chromedriver

### 2.1 Kiểm Tra Phiên Bản Chromium

```bash
chromium --version
```

Nếu chưa cài đặt, hãy chạy:

```bash
sudo apt install chromium-browser
```

### 2.2 Kiểm Tra và Cài Đặt Chromedriver

```bash
chromedriver --version
```

Nếu chưa cài đặt, hãy chạy:

```bash
sudo apt install chromium-chromedriver
```

### 2.3 Đảm Bảo Đường Dẫn Đúng

```bash
which chromium
which chromedriver
```

Đảm bảo kết quả trả về là:

- `/usr/bin/chromium`
- `/usr/bin/chromedriver`

---

## 🔧 3. Cấu Hình

### 3.1 Cấu Hình Tài Khoản

Chỉnh sửa file `input/accounts.csv` (bằng Excel hoặc text editor) theo định dạng:

```
username,password,seedphrase,services,profile_volume
```

- username: Username của tài khoản(email), không được trùng với cái account khác
- password: Password của tài khoản
- seedphrase: Seedphrase của tài khoản dùng để log in các ví Metamask, Kepler, ... dùng 12 seed pharse
- services: Các service bằng dạng "service1 service2 service3" (phân cách bởi dấu phân cách)
- profile_volume: Số profile chạy của account () mỗi profile sẽ tự động gán proxy từ file input/proxy.csv

Ví dụ:

```
example@example.com,password123,seed1 seed2 ... seed12,service1 service2,3
```

**Mở bằng nano (Linux):**

```bash
nano input/accounts.csv
```

### 3.2 Cấu Hình Proxy

Chỉnh sửa file `input/proxy.csv` theo định dạng:

```
username:password@ip:port
```

Ví dụ:

```
proxyuser:proxypass@192.168.1.10:3128
```

**Mở bằng nano:**

```bash
nano input/proxy.csv
```

Hoặc sử dụng Excel để chỉnh sửa dễ dàng hơn.

---

## 🚀 4. Chạy Ứng Dụng

Ứng dụng sẽ chạy theo dữ liệu được cung cấp trong `input/accounts.csv`.

### Sử Dụng CMD hoặc Linux:

```cmd
tsc && node app.js
```

### Sử Dụng PowerShell:

```powershell
tsc -and node app.js
```

---

## 🔔 5. Lưu Ý

- Đảm bảo phiên bản **Chromium** và **Chromedriver** khớp nhau, nếu không có thể gây lỗi khi tự động hóa.
  <!-- - Khi sử dụng `--reset`, tất cả dữ liệu và folder `profiles` sẽ bị **xoá**. Chỉ dùng khi muốn bắt đầu từ đầu.   -->
  <!-- - Nếu đã có profile và DB (chứa thông tin đăng nhập, proxy, v.v.), có thể bỏ qua `--reset`. Chỉ cần gọi `--services` (và tùy chọn `--proxy` nếu muốn cập nhật/gán mới).   -->

---

## 💡 Góp Ý và Hỗ Trợ

Nếu bạn gặp vấn đề hoặc có ý tưởng cải tiến, hãy tạo một issue hoặc pull request trên GitHub.

**Chúc bạn farming hiệu quả với Farm Multi Nodeverse! 🚀**
