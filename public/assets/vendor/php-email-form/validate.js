document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector(".php-email-form");

  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const loading = form.querySelector(".loading");
    const errorMsg = form.querySelector(".error-message");
    const successMsg = form.querySelector(".sent-message");

    loading.classList.add("d-block");
    errorMsg.classList.remove("d-block");
    successMsg.classList.remove("d-block");

    // Coleta os dados do form
    const formData = {
      name: form.querySelector("#name").value,
      email: form.querySelector("#email").value,
      phone: form.querySelector("#phone").value,
      subject: form.querySelector("#subject").value,
      message: form.querySelector("#message").value,
    };

    // Envia via EmailJS
    emailjs
      .send("service_0ykbwnp", "template_lj5sigh", formData)
      .then(() => {
        loading.classList.remove("d-block");
        successMsg.classList.add("d-block");
        form.reset();
      })
      .catch((err) => {
        loading.classList.remove("d-block");
        errorMsg.innerHTML = "Erro ao enviar: " + err.text;
        errorMsg.classList.add("d-block");
      });
  });
});