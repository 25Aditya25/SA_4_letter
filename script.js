(function () {
  const envelopeWrap = document.getElementById("envelope-wrap");
  const envelopeStage = document.getElementById("envelope-stage");
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
    envelopeStage?.classList.add("is-open");
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
    clone.removeAttribute("id");
    /* Keep typography hooks; pdf-export-clone overrides opacity/animation (see styles.css) */
    clone.className = "letter-paper letter-paper--mr pdf-export-clone";
    clone.style.cssText = [
      "box-sizing: border-box",
      "width: 520px",
      "max-width: 100%",
      "padding: 44px 52px",
      "font-size: 14pt",
      "line-height: 1.88",
      "color: #2c2420",
      "background: #fdf8f3",
      'font-family: "Tiro Devanagari Marathi", "Noto Serif Devanagari", Georgia, serif',
      "opacity: 1",
      "visibility: visible",
      "transform: none",
      "position: relative",
      "animation: none",
    ].join("; ");

    const wrapper = document.createElement("div");
    /* Off-screen capture often yields empty canvas in WebKit; keep in viewport but nearly invisible */
    wrapper.setAttribute("aria-hidden", "true");
    wrapper.style.cssText = [
      "position: fixed",
      "left: 0",
      "top: 0",
      "width: 520px",
      "z-index: 2147483646",
      "opacity: 0.02",
      "pointer-events: none",
      "overflow: hidden",
    ].join("; ");

    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    if (document.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch (_) {
        /* ignore */
      }
    }
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    const opt = {
      margin: [12, 12, 12, 12],
      filename: "samruddhi-patra.pdf",
      image: { type: "jpeg", quality: 0.96 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false,
        backgroundColor: "#fdf8f3",
        scrollX: 0,
        scrollY: 0,
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight,
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    };

    try {
      await html2pdf().set(opt).from(clone).save();
    } catch (err) {
      console.error(err);
      window.print();
    } finally {
      wrapper.remove();
    }
  });
})();
