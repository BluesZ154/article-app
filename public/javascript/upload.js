const previewBtn = document.querySelector('#preview-button');
const saveBtn = document.querySelector('#save-button');
const output = document.querySelector('#output');

const toolBars = [
  // font options
  [{ font: [] }],

  //   header options
  [{ header: [1, 2, 3] }],

  // text utilities
  ["bold", "italic", "underline", "strike"],

  // text colors and bg colors
  [{ color: [] }, { background: [] }],

  // lists
  [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],

  // block quotes and code blocks
  ["blockquote", "code-block"],

  // media
  ["link", "image", "video"],

  // alignment
  [{ align: [] }],
];

const quill = new Quill("#editor-container", {
  theme: "snow",
  modules: {
    toolbar: toolBars
  }
});

if (previewBtn) {
  previewBtn.addEventListener('click', () => {
    const content = quill.root.innerHTML;

    output.classList.toggle('active');
    if (output.classList.contains('active')) {
      setTimeout(() => {
        output.textContent = content;
      }, 400);
      previewBtn.textContent = "Close";
    }
    else {
      output.textContent = "";
      previewBtn.textContent = "Preview HTML";
    }
  })
}

