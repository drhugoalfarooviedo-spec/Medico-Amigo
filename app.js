document.addEventListener("DOMContentLoaded", () => {

  const loginForm = document.getElementById("loginForm");

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;

    alert(
      "Médico Amigo\n\n" +
      "Pantalla de acceso funcionando correctamente.\n\n" +
      "Usuario: " + email
    );
  });

});
