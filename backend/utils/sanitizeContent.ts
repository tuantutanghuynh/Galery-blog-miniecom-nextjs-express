import sanitizeHtml from 'sanitize-html';

// Lọc HTML do admin soạn trước khi ghi vào database.
//
// Vì sao lọc ở đây chứ không ở frontend: đây là chỗ nghẽn duy nhất mà mọi nội dung phải đi
// qua, nên dữ liệu nằm trong DB đã sạch sẵn. Nếu lọc ở tầng hiển thị thì mỗi nơi render đều
// phải nhớ tự lọc, và chỉ cần một chỗ quên là thủng. Nội dung bài viết được bơm ra trang
// công khai bằng `dangerouslySetInnerHTML`, nên một thẻ `<script>` lọt vào sẽ chạy trong
// trình duyệt của mọi khách chứ không riêng người đăng.
//
// Whitelist bám đúng những gì thanh công cụ Quill có thể sinh ra (xem TOOLBAR_OPTIONS trong
// components/admin/RichTextEditor.tsx): tiêu đề, in đậm/nghiêng/gạch, danh sách, thụt lề,
// căn lề, liên kết, ảnh, video. Thẻ nào ngoài danh sách bị gỡ bỏ, phần chữ bên trong vẫn giữ.
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'span', 'div',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'sub', 'sup',
    'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'hr',
    'a', 'img', 'iframe',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],

  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    iframe: ['src', 'width', 'height', 'allowfullscreen', 'frameborder', 'allow'],
    // `class` để Quill giữ được căn lề và thụt lề; danh sách allowedClasses bên dưới siết
    // lại chỉ cho phép tiền tố `ql-` nên không ai nhét được class tuỳ ý vào.
    '*': ['class'],
  },

  allowedClasses: { '*': ['ql-*'] },

  // Chặn `javascript:` và mọi scheme lạ ở thuộc tính href/src.
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  // Nút chèn ảnh mặc định của Quill tạo ảnh base64, nên `data:` phải được phép — riêng
  // SVG bị loại ở transformTags bên dưới vì file SVG có thể chứa script.
  allowedSchemesByTag: { img: ['http', 'https', 'data'] },

  // Video chỉ nhúng được từ hai nền tảng này; iframe trỏ đi nơi khác bị gỡ cả thẻ.
  allowedIframeHostnames: ['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com'],

  transformTags: {
    // Liên kết ra ngoài luôn kèm rel="noopener noreferrer": thiếu nó thì trang đích đọc được
    // window.opener và có thể điều hướng tab gốc sang trang giả mạo.
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),

    // data:image/svg+xml có thể chứa <script> chạy được, nên bỏ hẳn src thay vì tin vào
    // việc trình duyệt không thực thi nó.
    img: (tagName, attribs) => {
      const src = attribs.src || '';
      if (/^data:image\/svg\+xml/i.test(src.trim())) {
        const { src: _removed, ...rest } = attribs;
        return { tagName, attribs: rest };
      }
      return { tagName, attribs };
    },
  },
};

// Trả về chuỗi đã lọc. Giữ nguyên `undefined`/`null` để controller phân biệt được "không gửi
// trường này" với "gửi chuỗi rỗng" — Prisma bỏ qua undefined nhưng sẽ ghi đè bằng chuỗi rỗng.
export function sanitizeContent(html: string): string;
export function sanitizeContent(html: undefined | null): undefined;
export function sanitizeContent(html?: string | null): string | undefined;
export function sanitizeContent(html?: string | null): string | undefined {
  if (html === undefined || html === null) return undefined;
  return sanitizeHtml(html, OPTIONS);
}

export default sanitizeContent;
