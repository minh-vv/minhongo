# Kanji Interactive Hub (Trung tâm Học Hán tự Tương tác)

## Problem Statement
**Làm thế nào để** biến trang học Hán tự từ những tấm thẻ ghi nhớ phẳng (flat flashcards) trở thành một trải nghiệm tương tác trực quan, giúp người học hiểu sâu cấu trúc chữ qua bộ thủ (Radicals), thứ tự nét vẽ (Stroke order) và liên tưởng sơ đồ từ ghép (Jukugo)?

---

## Recommended Direction
Chúng ta sẽ xây dựng lại trải nghiệm trang Hán tự thành **Kanji Interactive Hub** (Trung tâm Học Hán tự Tương tác). Thay vì sử dụng giao diện flashcard chung như trang Từ vựng, trang Hán tự mới sẽ bao gồm:
1. **Bản đồ tiến độ học Kanji (Kanji Progress Grid):** Thay thế giao diện danh sách bài học bằng một mạng lưới các ô chữ Kanji tương ứng với cấp độ JLPT đang chọn. Các ô chữ sẽ tự động đổi màu dựa trên tiến độ học tập của người dùng (Chưa học, Đang học, Đã thuộc). Bấm vào ô bất kỳ sẽ mở ra giao diện học tương tác.
2. **Giao diện Học tương tác (Kanji Interactive Workspace):**
   * **Bên trái — Bảng vẽ viết nét (Writing Canvas):** Tích hợp thư viện `hanzi-writer` (tải qua CDN hoặc import trực tiếp) hiển thị hoạt ảnh vẽ nét (Stroke Animation) và một bảng vẽ cho phép người dùng tự dùng chuột/tay vẽ đè lên để kiểm tra nét vẽ đúng/sai thời gian thực.
   * **Bên phải — Giải phẫu chữ & Câu chuyện liên tưởng (Anatomy & Mnemonics):** Hiển thị chi tiết chữ Kanji, cách đọc Onyomi/Kunyomi, nghĩa Hán-Việt, và đặc biệt là phân rã chữ Kanji đó thành các bộ thủ nhỏ kèm câu chuyện gợi nhớ sinh động.
   * **Phía dưới — Từ ghép thực tế (Jukugo List):** Liệt kê các từ ghép phổ biến chứa chữ Kanji này cùng cách đọc và nghĩa tiếng Việt, giúp người học chuyển tiếp từ việc nhận dạng mặt chữ sang sử dụng từ vựng trong thực tiễn.

---

## Key Assumptions to Validate
- [ ] **Khả năng tương thích nét vẽ:** Dữ liệu nét vẽ của `hanzi-writer` (vốn phát triển cho chữ Hán Trung Quốc) khớp hoàn toàn với thứ tự nét của Kanji tiếng Nhật (Jōyō Kanji) $\rightarrow$ *Cách kiểm tra: Thực nghiệm tải dữ liệu nét vẽ của các chữ Kanji đặc thù tiếng Nhật xem có bị lệch nét hay không.*
- [ ] **Dữ liệu bộ thủ và câu chuyện liên tưởng (Mnemonics):** Chúng ta có nguồn dữ liệu tiếng Việt phong phú để hiển thị câu chuyện liên tưởng và phân rã bộ thủ $\rightarrow$ *Cách kiểm tra: Tìm kiếm nguồn dữ liệu open-source (như KanjiDic hoặc cơ sở dữ liệu từ điển Kanji) hoặc chuẩn bị sẵn một bộ dữ liệu JSON tĩnh mẫu cho cấp độ N5.*
- [ ] **Hiệu năng của lưới chữ Grid:** Việc hiển thị cùng lúc ~100-200 ô chữ kèm thông tin tiến độ học trên các thiết bị di động cấu hình yếu không bị giật lag $\rightarrow$ *Cách kiểm tra: Render thử nghiệm lưới 200 chữ Kanji với CSS đơn giản.*

---

## MVP Scope (Phạm vi phiên bản đầu tiên)
### Tính năng NẰM TRONG phạm vi (In-Scope)
* **Kanji Grid (Bản đồ tiến độ):** Hiển thị lưới chữ cho cấp độ JLPT N5 (~103 chữ). Hỗ trợ lọc theo trạng thái học tập (Mới, Đang học, Đã thuộc) dựa trên dữ liệu SRS/ReviewLog hiện có.
* **Popup/Drawer học tương tác:** Khi bấm vào 1 chữ từ lưới, mở ra 1 Modal/Drawer chi tiết chứa:
  * **Stroke Player:** Nút Play/Pause để chạy hoạt ảnh nét viết.
  * **Writing Canvas:** Vùng vẽ để người dùng thực hành đồ nét.
  * **Radical Analysis:** Tách chữ thành các bộ thủ cấu thành (ví dụ chữ `男` gồm bộ `田` điền và bộ `力` lực) kèm giải thích nghĩa đơn giản.
  * **Mnemonic Story:** Hiển thị 1 câu chuyện gợi nhớ mẫu cho chữ đó.
  * **Từ ghép (Jukugo):** Hiển thị 3-5 từ ghép cơ bản nhất chứa chữ đó.

### Tính năng NẰM NGOÀI phạm vi (Out-of-Scope)
* **Tính năng tự viết không có nét gợi ý nâng cao:** MVP sẽ chỉ hỗ trợ đồ nét (Trace mode) và kiểm tra nét cơ bản, chưa làm tính năng nhận diện chữ viết tay tự do (Freehand recognition) vì đòi hỏi model AI phức tạp.
* **Game hóa (Drag & Drop Radical Game):** Chuyển sang giao diện phát triển sau khi hệ thống cốt lõi đã chạy mượt.
* **Cộng đồng đóng góp câu chuyện (Crowdsourced Mnemonics):** MVP chỉ cung cấp câu chuyện cố định có sẵn, chưa hỗ trợ hệ thống CRUD câu chuyện cho từng tài khoản và chức năng Upvote/Downvote.

---

## Not Doing (and Why)
- **Tích hợp Model AI nhận diện chữ viết tay tự do tự xây dựng:** *Lý do:* Rất mất thời gian phát triển và tốn tài nguyên frontend/backend. Sử dụng thư viện SVG vẽ nét sẵn có như `hanzi-writer` là quá đủ để giải quyết nhu cầu học viết đúng thứ tự.
- **Xây dựng hệ thống Editor vẽ SVG bộ thủ thủ công:** *Lý do:* Tận dụng cơ sở dữ liệu SVG có sẵn từ cộng đồng (như KanjiVG) để tự động hóa việc hiển thị các nét thay vì tự tay vẽ từng nét chữ trong hệ thống quản trị (Admin).

---

## Open Questions (Câu hỏi mở)
1. **Nguồn dữ liệu nét vẽ:** Chúng ta nên load SVG nét vẽ trực tiếp từ CDN công khai của Hanzi Writer (miễn phí, nhanh, nhưng phụ thuộc internet) hay tải bộ dữ liệu nét về lưu trực tiếp trong thư mục `public` của frontend/backend?
2. **Dữ liệu câu chuyện Mnemonics:** Chúng ta sẽ tự dịch thuật/soạn thảo các câu chuyện gợi nhớ cho 103 chữ Kanji N5 trước, hay sử dụng một API dịch tự động từ tiếng Anh (như bộ câu chuyện của Heisig WaniKani)?
