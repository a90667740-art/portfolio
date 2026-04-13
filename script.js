const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function typingEffect(targetEl, phrases, options = {}) {
  const {
    typeSpeed = 48,
    deleteSpeed = 26,
    pauseMs = 1100,
    betweenMs = 250,
  } = options;

  if (!targetEl || !phrases?.length) return () => {};

  let phraseIdx = 0;
  let charIdx = 0;
  let isDeleting = false;
  let rafId = 0;
  let timerId = 0;
  let lastTs = 0;
  let delay = typeSpeed;

  const tick = (ts) => {
    if (!lastTs) lastTs = ts;
    const dt = ts - lastTs;
    if (dt < delay) {
      rafId = requestAnimationFrame(tick);
      return;
    }
    lastTs = ts;

    const full = phrases[phraseIdx];
    const nextCharIdx = isDeleting ? charIdx - 1 : charIdx + 1;
    charIdx = Math.max(0, Math.min(full.length, nextCharIdx));
    targetEl.textContent = full.slice(0, charIdx);

    if (!isDeleting && charIdx === full.length) {
      isDeleting = true;
      delay = deleteSpeed;
      clearTimeout(timerId);
      timerId = window.setTimeout(() => {
        rafId = requestAnimationFrame(tick);
      }, pauseMs);
      return;
    }

    if (isDeleting && charIdx === 0) {
      isDeleting = false;
      phraseIdx = (phraseIdx + 1) % phrases.length;
      delay = typeSpeed;
      clearTimeout(timerId);
      timerId = window.setTimeout(() => {
        rafId = requestAnimationFrame(tick);
      }, betweenMs);
      return;
    }

    delay = isDeleting ? deleteSpeed : typeSpeed;
    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(rafId);
    clearTimeout(timerId);
  };
}

function initReveal() {
  const els = $$(".reveal");
  if (!els.length) return;

  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.14, rootMargin: "20px 0px -10px 0px" },
  );

  els.forEach((el) => io.observe(el));
}

function initMobileNav() {
  const btn = $(".nav-toggle");
  const menu = $("#navMenu");
  if (!btn || !menu) return;

  const setOpen = (open) => {
    btn.setAttribute("aria-expanded", String(open));
    menu.classList.toggle("open", open);
  };

  btn.addEventListener("click", () => {
    const open = btn.getAttribute("aria-expanded") !== "true";
    setOpen(open);
  });

  // Close menu on link click (mobile)
  $$("#navMenu a").forEach((a) => {
    a.addEventListener("click", () => setOpen(false));
  });

  // Close on outside click / Escape
  document.addEventListener("click", (e) => {
    if (window.matchMedia("(max-width: 720px)").matches) {
      if (!menu.contains(e.target) && !btn.contains(e.target)) setOpen(false);
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
}

const EMAILJS_SERVICE_ID = "service_gk1e1m8";
const EMAILJS_TEMPLATE_ID = "template_6q4keoa";

function initForm() {
  const form = $("#coffeeForm");
  if (!form) return;

  const status = $("#formStatus");
  const name = $("#name");
  const email = $("#email");
  const message = $("#message");
  const submitBtn = $('button[type="submit"]', form);
  const resetBtn = $('button[type="reset"]', form);

  const fields = [
    { el: name, min: 2, type: "text" },
    { el: email, type: "email" },
    { el: message, min: 10, type: "text" },
  ];

  const setStatus = (text, kind) => {
    if (!status) return;
    status.textContent = text;
    status.classList.remove("ok", "err");
    if (kind) status.classList.add(kind);
  };

  const validateField = (field) => {
    const el = field.el;
    if (!el) return true;
    const wrap = el.closest(".field");
    const v = (el.value ?? "").trim();

    let ok = true;
    if (field.type === "email") {
      ok = el.checkValidity();
    } else if (field.min) {
      ok = v.length >= field.min;
    } else {
      ok = v.length > 0;
    }

    if (wrap) wrap.classList.toggle("invalid", !ok);
    return ok;
  };

  fields.forEach((f) => {
    if (!f.el) return;
    f.el.addEventListener("input", () => validateField(f));
    f.el.addEventListener("blur", () => validateField(f));
  });

  form.addEventListener("reset", () => {
    setStatus("", null);
    fields.forEach((f) => {
      const wrap = f.el?.closest?.(".field");
      if (wrap) wrap.classList.remove("invalid");
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    setStatus("", null);

    const allOk = fields.every(validateField);
    if (!allOk) {
      setStatus("입력 내용을 확인해주세요.", "err");
      const firstInvalid = $(".field.invalid input, .field.invalid textarea", form);
      firstInvalid?.focus?.();
      return;
    }

    if (typeof emailjs === "undefined" || !emailjs.sendForm) {
      setStatus(
        "EmailJS를 불러오지 못했습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.",
        "err",
      );
      return;
    }

    const originalSubmitLabel = submitBtn ? submitBtn.textContent : "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "보내는 중...";
    }
    if (resetBtn) resetBtn.disabled = true;

    emailjs
      .sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, form)
      .then(() => {
        alert("메일이 성공적으로 발송되었습니다!");
        form.reset();
        setStatus("", null);
      })
      .catch((err) => {
        const detail =
          err?.text ||
          err?.message ||
          (typeof err === "string" ? err : JSON.stringify(err));
        setStatus(
          detail
            ? `메일 전송에 실패했습니다: ${detail}`
            : "메일 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.",
          "err",
        );
      })
      .finally(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalSubmitLabel;
        }
        if (resetBtn) resetBtn.disabled = false;
      });
  });
}

function initBasics() {
  setText("year", String(new Date().getFullYear()));

  const name = "계승범";
  setText("brandName", name);
  setText("heroName", name);
  setText("footerName", name);

  const typingEl = $("#typingText");
  const phrases = [
    "Digital Marketing Architect · Ad-Tech Business Leader",
    "Global Media Governance · API 권한 기반 파트너십 전략",
    "TradingWorks ATD 설계 · Data-Driven Growth 실행",
    "Full-funnel Performance로 ROI를 극대화합니다",
  ];
  typingEffect(typingEl, phrases, { typeSpeed: 46, deleteSpeed: 26, pauseMs: 1150 });
}

document.addEventListener("DOMContentLoaded", () => {
  initBasics();
  initReveal();
  initMobileNav();
  initForm();
});

