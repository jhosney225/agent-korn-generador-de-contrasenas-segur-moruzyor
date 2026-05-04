
```javascript
import Anthropic from "@anthropic-ai/sdk";
import * as readline from "readline";

const client = new Anthropic();

// Función para calcular la entropía de una contraseña
function calculateEntropy(password) {
  const charsets = {
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /[0-9]/.test(password),
    symbols: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  let poolSize = 0;
  if (charsets.lowercase) poolSize += 26;
  if (charsets.uppercase) poolSize += 26;
  if (charsets.numbers) poolSize += 10;
  if (charsets.symbols) poolSize += 32;

  const entropy = password.length * Math.log2(poolSize);
  return {
    entropy: Math.round(entropy * 100) / 100,
    poolSize,
    charsets,
  };
}

// Función para evaluar la fortaleza de la contraseña
function evaluatePasswordStrength(entropy) {
  if (entropy < 20) return "Muy débil";
  if (entropy < 40) return "Débil";
  if (entropy < 60) return "Moderada";
  if (entropy < 80) return "Fuerte";
  if (entropy < 120) return "Muy fuerte";
  return "Extremadamente fuerte";
}

// Función para generar contraseña segura
function generateSecurePassword(length = 16) {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+-=[]{}';:\"\\|,.<>/?";

  const allChars = lowercase + uppercase + numbers + symbols;
  let password = "";

  // Garantizar al menos un carácter de cada tipo
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Llenar el resto aleatoriamente
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Barajar la contraseña
  password = password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");

  return password;
}

// Función para interactuar con Claude
async function analyzePasswordWithClaude(password, entropy, strength) {
  const stream = await client.messages.stream({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `Analiza la siguiente contraseña desde una perspectiva de seguridad:
Contraseña: ${password}
Entropía: ${entropy.entropy} bits
Tamaño del pool de caracteres: ${entropy.poolSize}
Fortaleza estimada: ${strength}
Caracteres usados: ${Object.entries(entropy.charsets)
          .filter(([_, used]) => used)
          .map(([type]) => type)
          .join(", ")}

Por favor, proporciona:
1. Un análisis breve de la seguridad
2. Recomendaciones para mejorar si es necesario
3. Tiempo estimado para fuerza bruta (suposición: 1 billón de intentos/segundo)`,
      },
    ],
  });

  return stream;
}

// Función principal para la interfaz interactiva
async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt) =>
    new Promise((resolve) => {
      rl.question(prompt, resolve);
    });

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║  Generador de Contraseñas Seguras con Medidor de Entropía  ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  let continueLoop = true;

  while (continueLoop) {
    console.log("\nOpciones:");
    console.log("1. Generar contraseña segura");
    console.log("2. Analizar contraseña existente");
    console.log("3. Salir");

    const choice = await question("\nSelecciona una opción (1-3): ");

    if (choice === "1") {
      const lengthInput = await question(
        "¿Longitud de la contraseña? (por defecto 16): "
      );
      const length = lengthInput ? parseInt(lengthInput) : 16;

      if (isNaN(length) || length < 8) {
        console.log("❌ Por favor, ingresa una longitud válida (mínimo 8)");
        continue;
      }

      const password = generateSecurePassword(length);
      const entropy = calculateEntropy(password);
      const strength = evaluatePasswordStrength(entropy.entropy);

      console.log("\n" + "=".repeat(60));
      console.log("📋 CONTRASEÑA GENERADA:");
      console.log("=".repeat(60));
      console.log(`Contraseña: ${password}`);
      console.log(`Longitud: ${password.length}