---
title: Hướng dẫn viết blog bằng Markdown
date: 2026-11-19
description: Cách tạo bài mới, định dạng chữ, danh sách, code block, bảng và chèn ảnh cho blog này.
draft: true
---

Bài này là "cheat sheet" để viết blog trên trang này. Nó đang là **draft** nên chỉ hiện khi preview trên máy, không bao giờ được deploy lên web.

Mỗi mục bên dưới có hai phần: **Viết** là những gì bạn gõ trong file `.md`, **Kết quả** là cách nó hiển thị trên trang.

---

## 1. Tạo một bài viết mới

**Bước 1.** Tạo file trong thư mục `blog/`, tên theo dạng `YYYY-MM-DD-ten-bai.md`, ví dụ:

```text
blog/2026-11-20-nang-cap-eks.md
```

Phần sau ngày tháng (`nang-cap-eks`) là đường dẫn của bài: `/blogs/nang-cap-eks/`. Chỉ dùng chữ thường không dấu, số và dấu `-`.

**Bước 2.** Đầu file là phần *front matter*, nằm giữa hai dòng `---`:

```markdown
---
title: Nâng cấp EKS từ 1.32 lên 1.33
date: 2026-11-20
description: Những gì cần kiểm tra trước khi bấm nút upgrade.
draft: true
---

Nội dung bài viết bắt đầu từ đây...
```

| Trường | Bắt buộc | Ý nghĩa |
|---|:---:|---|
| `title` | ✅ | Tiêu đề bài, hiện to ở đầu trang và trong danh sách |
| `date` | | Ngày đăng `YYYY-MM-DD`; bỏ trống thì lấy từ tên file |
| `description` | | Một câu tóm tắt, hiện dưới tiêu đề ở trang `/blogs/` |
| `slug` | | Đổi đường dẫn bài nếu không muốn lấy từ tên file |
| `draft` | | `true` = chỉ thấy khi preview, không deploy |

**Bước 3.** Xem thử trên máy:

```bash
npm run build:drafts
python -m http.server 8000 -d _site
# mở http://localhost:8000/blogs/
```

**Bước 4.** Đăng bài: đổi `draft: true` thành `draft: false` (hoặc xoá dòng đó), commit rồi push lên `main`. GitHub Actions sẽ tự build và deploy.

---

## 2. Tiêu đề

**Viết:**

```markdown
## Tiêu đề lớn (cấp 2)
### Tiêu đề nhỏ (cấp 3)
```

Không dùng `#` (cấp 1) trong bài, vì `title` trong front matter đã là tiêu đề cấp 1 của trang.

**Mục lục** (khung "Contents") được tạo tự động từ các tiêu đề `##` và `###`, theo đúng thứ tự trong bài. Bài cần có ít nhất 2 tiêu đề `##` thì mới có mục lục. Mỗi tiêu đề cũng có link riêng, ví dụ tiêu đề `## 8. Chèn ảnh` có link `/blogs/<slug>/#8-chen-anh`, dùng để gửi người khác tới thẳng một mục.

---

## 3. Định dạng chữ

| Viết | Kết quả |
|---|---|
| `**in đậm**` | **in đậm** |
| `*in nghiêng*` | *in nghiêng* |
| `***đậm và nghiêng***` | ***đậm và nghiêng*** |
| `~~gạch ngang~~` | ~~gạch ngang~~ |
| `` `code trong dòng` `` | `code trong dòng` |
| `[Kubernetes](https://kubernetes.io)` | [Kubernetes](https://kubernetes.io) |
| `<kbd>Ctrl</kbd> + <kbd>C</kbd>` | <kbd>Ctrl</kbd> + <kbd>C</kbd> |

### Tô màu chữ

Markdown chuẩn không có cú pháp đổi màu chữ, nên blog này có thêm hai cú pháp riêng. Màu tự đổi cho hợp với theme sáng/tối.

| Viết | Kết quả |
|---|---|
| `:red[chữ đỏ]` | :red[chữ đỏ] |
| `:orange[chữ cam]` | :orange[chữ cam] |
| `:yellow[chữ vàng]` | :yellow[chữ vàng] |
| `:green[chữ xanh lá]` | :green[chữ xanh lá] |
| `:blue[chữ xanh dương]` | :blue[chữ xanh dương] |
| `:purple[chữ tím]` | :purple[chữ tím] |
| `:gray[chữ xám]` | :gray[chữ xám] |
| `==tô nền như bút dạ quang==` | ==tô nền như bút dạ quang== |

Có thể kết hợp với in đậm, in nghiêng, code, link:

**Viết:**

```markdown
Trạng thái pod: :green[**Running**], :yellow[ContainerCreating], :red[**CrashLoopBackOff**].

==Lưu ý:== backup database trước khi chạy migration, xem :blue[*mục 6*].
```

**Kết quả:**

Trạng thái pod: :green[**Running**], :yellow[ContainerCreating], :red[**CrashLoopBackOff**].

==Lưu ý:== backup database trước khi chạy migration, xem :blue[*mục 6*].

Lưu ý khi tô màu:

- Chữ bên trong `[...]` không được chứa dấu `]`.
- Đây là cú pháp riêng của blog này: mở file `.md` trên GitHub sẽ chỉ thấy nguyên văn `:red[...]`.
- Nên dùng màu có chủ đích (trạng thái, cảnh báo, điểm quan trọng); tô quá nhiều chỗ sẽ khó đọc.

**Đoạn văn và xuống dòng:**

- Để **một dòng trống** giữa hai đoạn văn.
- Xuống dòng trong cùng một đoạn: kết thúc dòng bằng dấu `\`.
- Muốn hiện đúng ký tự đặc biệt như `*` hay `_` thì thêm `\` phía trước: `\*` hiện ra \*.

**Viết:**

```markdown
Dòng thứ nhất\
Dòng thứ hai, cùng một đoạn.

Đoạn văn mới.
```

**Kết quả:**

Dòng thứ nhất\
Dòng thứ hai, cùng một đoạn.

Đoạn văn mới.

---

## 4. Danh sách

**Viết:**

```markdown
- Gạch đầu dòng
- Gạch đầu dòng khác
  - Thụt vào 2 dấu cách để tạo mục con

1. Bước một
2. Bước hai
3. Bước ba

- [x] Việc đã xong
- [ ] Việc chưa làm
```

**Kết quả:**

- Gạch đầu dòng
- Gạch đầu dòng khác
  - Thụt vào 2 dấu cách để tạo mục con

1. Bước một
2. Bước hai
3. Bước ba

- [x] Việc đã xong
- [ ] Việc chưa làm

---

## 5. Code block

Bọc code giữa hai dòng ba dấu backtick (`` ``` ``) và **ghi tên ngôn ngữ ngay sau ba dấu mở đầu**. Khi build, code được tô màu theo ngôn ngữ đó, và tên ngôn ngữ hiện ở góc trên bên phải khối code.

**Viết:**

````markdown
```bash
kubectl rollout restart deploy my-portfolio
```
````

**Kết quả:**

```bash
kubectl rollout restart deploy my-portfolio
```

### Các ngôn ngữ hay dùng

| Nội dung | Ghi sau ```` ``` ```` |
|---|---|
| Lệnh / script shell | `bash` (hoặc `sh`) |
| Phiên terminal có prompt `$` và output | `console` |
| YAML: Kubernetes, Helm, GitHub Actions | `yaml` (hoặc `yml`) |
| JSON | `json` |
| Terraform / HCL | `hcl` (hoặc `terraform`, `tf`) |
| Dockerfile | `dockerfile` |
| Python | `python` |
| Go | `go` |
| JavaScript / TypeScript | `js` / `ts` |
| SQL | `sql` |
| INI / TOML | `ini` / `toml` |
| Nginx config | `nginx` |
| PowerShell | `powershell` |
| Makefile | `makefile` |
| Diff / thay đổi code | `diff` |
| Markdown | `markdown` |
| Không tô màu (log, cây thư mục…) | `text` |

Ghi sai hoặc ghi tên ngôn ngữ không có trong danh sách thì khối code vẫn hiện bình thường, chỉ là không có màu.

### Ví dụ từng ngôn ngữ

`bash`: script

```bash
#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="${1:-default}"
for deploy in $(kubectl get deploy -n "$NAMESPACE" -o name); do
  echo "Restarting $deploy"   # restart từng deployment
  kubectl rollout restart "$deploy" -n "$NAMESPACE"
done
```

`console`: phiên terminal, dòng bắt đầu bằng `$` là lệnh, còn lại là output

```console
$ kubectl get pods -l app=my-portfolio
NAME                           READY   STATUS    RESTARTS   AGE
my-portfolio-7d9f8c6b5-x2k9p   1/1     Running   0          2m
```

`yaml`

```yaml
# GitHub Actions
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - run: npm ci && npm run build
```

`json`

```json
{
  "name": "my-portfolio",
  "replicas": 3,
  "autoscaling": { "enabled": true, "maxReplicas": 10 },
  "tags": ["web", "prod"]
}
```

`hcl` (Terraform)

```hcl
# S3 bucket chứa log
resource "aws_s3_bucket" "logs" {
  bucket        = "my-portfolio-logs-${var.env}"
  force_destroy = false

  tags = {
    Owner = "devops"
  }
}

output "bucket_arn" {
  value = aws_s3_bucket.logs.arn
}
```

`dockerfile`

```dockerfile
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.29-alpine
COPY --from=build /app/_site /usr/share/nginx/html
EXPOSE 80
```

`python`

```python
import boto3

def list_buckets(prefix: str) -> list[str]:
    """Trả về tên các bucket bắt đầu bằng prefix."""
    s3 = boto3.client("s3")
    return [b["Name"] for b in s3.list_buckets()["Buckets"] if b["Name"].startswith(prefix)]
```

`go`

```go
package main

import "fmt"

func main() {
	replicas := 3
	fmt.Printf("scaling to %d replicas\n", replicas)
}
```

`sql`

```sql
SELECT slot_name, active, pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS lag
FROM pg_replication_slots
WHERE slot_type = 'logical';
```

`diff`: dòng `+` là thêm, dòng `-` là xoá

```diff
 spec:
-  replicas: 2
+  replicas: 3
   strategy:
     type: RollingUpdate
```

`text`: không tô màu

```text
2026-11-19T08:12:50Z INFO  deploy finished in 42s
```

### Mẹo

- Dòng code quá dài sẽ cuộn ngang trên điện thoại, nên giữ mỗi dòng dưới khoảng 80 ký tự.
- Muốn hiển thị **một code block bên trong code block** (như phần "Viết" ở trên), dùng **bốn** dấu backtick cho khối bên ngoài.
- Code trong dòng (`` `như thế này` ``) thì không tô màu.

---

## 6. Trích dẫn và ghi chú

**Viết:**

```markdown
> **Lưu ý:** luôn chạy `terraform plan` trước khi `apply`.
>
> Đoạn thứ hai của cùng một trích dẫn.
```

**Kết quả:**

> **Lưu ý:** luôn chạy `terraform plan` trước khi `apply`.
>
> Đoạn thứ hai của cùng một trích dẫn.

---

## 7. Bảng

Dấu `:` trên dòng kẻ dùng để căn lề: `:---` trái, `:---:` giữa, `---:` phải.

**Viết:**

```markdown
| Môi trường | Cluster | Số node |
|:---|:---:|---:|
| dev | eks-dev | 3 |
| prod | eks-prod | 12 |
```

**Kết quả:**

| Môi trường | Cluster | Số node |
|:---|:---:|---:|
| dev | eks-dev | 3 |
| prod | eks-prod | 12 |

---

## 8. Chèn ảnh

**Bước 1.** Đặt file ảnh vào `blog/images/`, nên tách mỗi bài một thư mục con cho gọn:

```text
blog/
├── 2026-11-20-nang-cap-eks.md
└── images/
    └── nang-cap-eks/
        ├── kien-truc.png
        └── grafana.png
```

Khi build, cả thư mục `blog/images/` được chép sang `/blogs/images/` trên web.

**Bước 2.** Trong bài viết, đường dẫn ảnh **bắt đầu bằng `/blogs/images/`**:

```markdown
![Luồng deploy của blog](/blogs/images/huong-dan-viet-blog/pipeline.svg)
```

**Kết quả:**

![Luồng deploy của blog: blog/*.md → GitHub Actions → GitHub Pages](/blogs/images/huong-dan-viet-blog/pipeline.svg)

*Chú thích ảnh: viết một dòng in nghiêng ngay dưới ảnh.*

**Các cách khác:**

```markdown
<!-- Hiện chữ khi rê chuột vào ảnh -->
![Mô tả](/blogs/images/ten-bai/anh.png "Chữ hiện khi rê chuột")

<!-- Ảnh bấm vào được, mở link -->
[![Mô tả](/blogs/images/ten-bai/anh.png)](https://example.com)

<!-- Đổi kích thước: dùng thẻ HTML -->
<img src="/blogs/images/ten-bai/anh.png" alt="Mô tả" width="400">
```

Mẹo:

- Phần trong `[...]` là **mô tả ảnh** (alt text): người dùng trình đọc màn hình sẽ nghe đoạn này, và nó hiện ra khi ảnh lỗi. Hãy viết cho có nghĩa.
- Tên file **không dấu, không dấu cách**: `kien-truc.png`, không phải `Kiến trúc.png`.
- Nên giữ mỗi ảnh dưới khoảng 300 KB. Ảnh chụp màn hình nên lưu `.png` hoặc `.webp`, ảnh chụp thường lưu `.jpg`, sơ đồ thì dùng `.svg`.
- Ảnh luôn tự co theo chiều ngang của bài, không lo tràn trên điện thoại.

---

## 9. Đường kẻ ngang

Một dòng chỉ có `---`, **phía trên phải là một dòng trống**. Nếu không có dòng trống, dòng chữ ngay phía trên sẽ bị biến thành tiêu đề.

---

## 10. Phần thu gọn

Markdown cho phép viết thẳng HTML, ví dụ một khối bấm để mở rộng:

```markdown
<details>
<summary>Xem log đầy đủ</summary>

Nội dung chỉ hiện khi bấm vào.

</details>
```

<details>
<summary>Xem log đầy đủ</summary>

Nội dung chỉ hiện khi bấm vào.

</details>

---

## Checklist trước khi đăng

- [ ] `title` và `description` đã viết rõ ràng
- [ ] Tên file / slug không dấu, chỉ dùng chữ thường, số và `-`
- [ ] Mọi ảnh đều có mô tả và nằm trong `blog/images/`
- [ ] Đã preview bằng `npm run build:drafts`
- [ ] Đã đổi `draft: true` → `draft: false`
- [ ] Không lộ thông tin nội bộ: tên khách hàng, IP, domain, secret
