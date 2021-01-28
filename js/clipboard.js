const barElement = document.getElementById("bar");
const closeElement = document.getElementById("close");
const dropdownElement = document.getElementById("dropdown-content");

function toggleContent() {
  barElement.classList.toggle("d-none");
  closeElement.classList.toggle("d-none");
  dropdownElement.classList.toggle("d-none");
}

function copyToClipboard(id) {
  const element = document.getElementById(id);
  const range = document.createRange();
  range.selectNodeContents(element);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  document.execCommand("copy");
}
