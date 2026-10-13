document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  let qrScanner = null;
  let isScanning = false;

  const demoFood = {
    nombre: "Carne de res de prueba",
    codigo: "CC-DEMO-001",
    lote: "PRUEBA-001",
    procedencia: "Finca demostrativa",
    vencimiento: "2027-01-30",
    tipoAlimento: "Carne refrigerada",
    nutricion: {
      sal: "Dato de ejemplo",
      azucares: "Dato de ejemplo",
      grasasSaturadas: "Dato de ejemplo",
      otros: "Prototipo escolar"
    },
    aviso: "Datos de prueba para la demostración educativa."
  };

  function status(message, error = false) {
    $("scan-status").textContent = message;
    $("scan-status").classList.toggle("error", error);
  }

  function goTo(id) {
    document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === id));
    document.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", b.dataset.view === id));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  document.querySelectorAll("[data-view]").forEach(b => b.addEventListener("click", () => goTo(b.dataset.view)));
  document.querySelectorAll("[data-goto]").forEach(b => b.addEventListener("click", () => goTo(b.dataset.goto)));

  function value(id, text) { $(id).textContent = text || "No indicado en el QR"; }

  function displayFood(data) {
    if (typeof data === "string") {
      try { data = JSON.parse(data); }
      catch { status("El QR se leyó, pero su contenido no tiene el formato de datos esperado.", true); return; }
    }
    const n = data.nutricion || {};
    value("food-name", data.nombre || data.producto);
    value("food-code", "Código: " + (data.codigo || "No indicado"));
    value("food-lot", data.lote);
    value("food-origin", data.procedencia || data.origen);
    value("food-expiry", data.vencimiento);
    value("food-type", data.tipoAlimento || data.tipo);
    value("food-salt", n.sal || n.sodio);
    value("food-sugar", n.azucares || n.azucar);
    value("food-fat", n.grasasSaturadas || n.grasas_saturadas);
    value("food-note", n.otros || data.aviso);
    $("empty-food").hidden = true;
    $("food-data").hidden = false;
    goTo("food");
  }

  $("demo-read").addEventListener("click", () => {
    displayFood(demoFood);
    status("Datos de demostración cargados. Se cargaron datos de prueba; no se ha leído un QR.");
  });

  async function stopScanner() {
    if (qrScanner) {
      try { if (isScanning) await qrScanner.stop(); } catch (_) {}
      try { await qrScanner.clear(); } catch (_) {}
    }
    qrScanner = null;
    isScanning = false;
    $("start-camera").hidden = false;
    $("stop-camera").hidden = true;
    $("camera-placeholder").hidden = false;
  }

  $("start-camera").addEventListener("click", async () => {
    const consent = window.confirm(
      "Consumo Consciente necesita permiso para usar la cámara y leer el código QR. ¿Deseas permitir el acceso a la cámara? El navegador también te pedirá autorización."
    );
    if (!consent) {
      status("No se activó la cámara. Puedes intentarlo cuando quieras.");
      return;
    }
    if (typeof Html5Qrcode === "undefined") {
      status("No se pudo cargar el lector QR. Conéctate a internet y vuelve a cargar la página.", true);
      return;
    }
    if (!(window.isSecureContext || ["localhost", "127.0.0.1"].includes(location.hostname))) {
      status("La cámara necesita una dirección HTTPS o localhost. No funciona al abrir el archivo directamente desde WhatsApp.", true);
      return;
    }
    $("start-camera").hidden = true;
    $("stop-camera").hidden = false;
    $("camera-placeholder").hidden = true;
    try {
      qrScanner = new Html5Qrcode("reader");
      status("Solicitando permiso de cámara…");
      await qrScanner.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decoded) => {
          await stopScanner();
          displayFood(decoded);
          status("QR leído correctamente.");
        }, () => {});
      isScanning = true;
      status("Cámara activa. Centra el QR dentro del recuadro.");
    } catch (e) {
      await stopScanner();
      status("No se pudo activar la cámara. Revisa los permisos del navegador y usa HTTPS o localhost.", true);
    }
  });
  $("stop-camera").addEventListener("click", async () => {
    await stopScanner();
    status("Cámara detenida.");
  });

  const colorInfo = {
    "Morado": { hex: "#7541a5", cls: "purple", text: "Color base de referencia para el experimento." },
    "Rosado": { hex: "#e879b9", cls: "pink", text: "Color observado en la prueba; requiere validación experimental." },
    "Turquesa": { hex: "#36bdb5", cls: "turquoise", text: "Color observado en la prueba; requiere validación experimental." },
    "Amarillo": { hex: "#f2cb45", cls: "yellow", text: "Color observado en la prueba; requiere validación experimental." }
  };
  $("record-color").addEventListener("click", () => {
    const name = $("observed-color").value;
    if (!name) {
      $("observation-title").textContent = "Selecciona un color primero";
      $("observation-text").textContent = "Elige uno de los colores de la guía y vuelve a registrar.";
      return;
    }
    const c = colorInfo[name];
    $("color-swatch").className = "swatch " + c.cls;
    $("observation-title").textContent = "Observación registrada: " + name;
    $("observation-text").textContent = c.text + " Esta observación solo se muestra en pantalla.";
  });
});