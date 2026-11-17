
import express from "express";

const app = express();
app.use(express.json({ limit: "15mb" }));

app.get("/", (req, res) => {
  res.send("Roblox Vibration - Servidor online!");
});

app.post("/calibrar", async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64 || !mimeType) {
      return res.status(400).json({
        erro: "Imagem não recebida"
      });
    }

    const imagem = imageBase64.replace(
      /^data:image\/\w+;base64,/,
      ""
    );

    const resposta = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "qwen/qwen3.8-27b",
          messages: [{
            role: "user",
            content: [
              {
                type: "text",
                text: `Analise esta captura de tela do Roblox Vox Seas.

A barra de vida fica no canto inferior esquerdo.

Procure cuidadosamente nessa região por uma barra horizontal verde.

Se encontrar, descreva:
- A posição da barra.
- A largura aproximada.
- A altura aproximada.
- A porcentagem aproximada de preenchimento.

Se não encontrar, explique o motivo.

Responda em português e seja objetivo.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${imagem}`
                }
              }
            ]
          }]
        })
      }
    );

    const dados = await resposta.json();

    if (!resposta.ok) {
      return res.status(resposta.status).json({
        erro: dados.error?.message || "Erro na Groq"
      });
    }

    const texto =
      dados.choices?.[0]?.message?.content ||
      "Nenhuma resposta recebida";

    res.json({
      resultado: texto,
      resposta: texto,
      text: texto
    });

  } catch (erro) {
    res.status(500).json({
      erro: erro.message
    });
  }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor iniciado na porta " + PORT);
});
                
