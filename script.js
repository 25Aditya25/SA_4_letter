(function () {
  const envelopeWrap = document.getElementById("envelope-wrap");
  const envelope = document.getElementById("envelope");
  const seal = document.getElementById("seal");
  const letterPanel = document.getElementById("letter-panel");
  const letterScroll = document.getElementById("letter-scroll");
  const letterContent = document.getElementById("letter-content");
  const btnDownload = document.getElementById("btn-download");

  const FLAP_MS = 900;
  let downloadUnlocked = false;

  function openLetter() {
    if (envelope.classList.contains("is-open")) return;
    envelope.classList.add("is-open");
    setTimeout(() => {
      envelopeWrap.classList.add("is-hidden");
      letterPanel.hidden = false;
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => {
        letterPanel.classList.add("is-revealed");
      });
      letterScroll.focus({ preventScroll: true });
      queueMicrotask(checkReadComplete);
    }, FLAP_MS);
  }

  seal.addEventListener("click", openLetter);
  seal.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openLetter();
    }
  });

  function isScrolledToBottom(el, slackPx) {
    const slack = slackPx ?? 48;
    return el.scrollHeight - el.scrollTop - el.clientHeight <= slack;
  }

  function checkReadComplete() {
    if (downloadUnlocked || letterPanel.hidden) return;
    if (isScrolledToBottom(letterScroll)) {
      downloadUnlocked = true;
      btnDownload.hidden = false;
      requestAnimationFrame(() => btnDownload.classList.add("is-visible"));
    }
  }

  letterScroll.addEventListener("scroll", checkReadComplete, { passive: true });
  window.addEventListener("resize", checkReadComplete);

  letterScroll.setAttribute("tabindex", "0");
  letterScroll.setAttribute("role", "region");
  letterScroll.setAttribute("aria-label", "पत्र");

  btnDownload.addEventListener("click", async () => {
    if (typeof html2pdf === "undefined") {
      window.print();
      return;
    }

    const clone = letterContent.cloneNode(true);
    clone.style.width = "520px";
    clone.style.boxSizing = "border-box";
    clone.style.padding = "44px 52px";
    clone.style.fontSize = "14pt";
    clone.style.lineHeight = "1.88";
    clone.style.color = "#2c2420";
    clone.style.background = "#fdf8f3";
    clone.style.fontFamily = '"Tiro Devanagari Marathi", "Noto Serif Devanagari", serif';

    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.left = "-9999px";
    wrapper.style.top = "0";
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    const opt = {
      margin: [12, 12, 12, 12],
      filename: "samruddhi-patra.pdf",
      image: { type: "jpeg", quality: 0.96 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    try {
      await html2pdf().set(opt).from(clone).save();
    } finally {
      wrapper.remove();
    }
  });
})();
