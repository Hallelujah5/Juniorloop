export const metadata = { title: 'Nguyên tắc dữ liệu' }

export default function NguyenTac() {
  return (
    <article className="max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">Nguyên tắc dữ liệu</h1>
      <div className="mt-4 space-y-4 text-[15px] leading-7 text-stone-700">
        <p>
          JuniorLoop là công cụ <strong>phi thương mại</strong> giúp junior dev tìm việc nhanh
          hơn. Chúng tôi gom tin từ trang tìm kiếm <em>công khai</em> của TopDev, ITviec, TopCV
          và tuân thủ các nguyên tắc sau:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>Chỉ lưu metadata</strong>: chức danh, tên công ty, mức lương hiển thị, địa điểm, kỹ năng và đường dẫn về tin gốc. Không sao chép mô tả công việc.</li>
          <li><strong>Luôn dẫn về nguồn</strong>: muốn đọc chi tiết hay ứng tuyển, bạn bấm sang trang gốc. JuniorLoop không thay thế các trang nguồn — nó đưa người dùng đến cho họ.</li>
          <li><strong>Không lưu thông tin cá nhân</strong> trong tin tuyển dụng (tên, SĐT, email người phụ trách) và không có tài khoản người dùng — hồ sơ chấm điểm nằm trong trình duyệt của bạn.</li>
          <li><strong>Quét lịch sự</strong>: 4 lần/ngày, có độ trễ giữa các request, User-Agent ghi rõ danh tính. Không vượt đăng nhập, không vượt CAPTCHA.</li>
          <li><strong>Gỡ ngay khi được yêu cầu</strong>: mỗi nguồn có công tắc riêng. Nếu bạn đại diện trang nguồn và muốn chúng tôi dừng, mở issue trên GitHub của dự án hoặc liên hệ qua email trong hồ sơ GitHub — nguồn sẽ được tắt trong vòng 48 giờ.</li>
        </ul>
        <p className="text-sm text-stone-500">
          Dữ liệu hiển thị có thể trễ tối đa vài giờ so với trang nguồn; tin không còn thấy
          trên trang nguồn sẽ được ẩn, nhưng điều đó không đồng nghĩa vị trí đã đóng.
        </p>
      </div>
    </article>
  )
}
