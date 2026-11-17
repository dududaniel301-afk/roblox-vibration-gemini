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
                text: `Analise a captura de tela do Roblox Vox Seas.

A barra de vida fica no canto inferior esquerdo.
Ela é VERDE.
Existe outra barra AZUL abaixo dela. NÃO confunda as duas.

Localize somente a barra VERDE de vida.

Retorne exclusivamente um JSON neste formato:
{"found":true,"box_2d":[ymin,xmin,ymax,xmax]}

As coordenadas devem estar entre 0 e 1000.
A ordem é: topo, esquerda, base, direita.

Se não encontrar claramente a barra verde, retorne:
{"found":false,"box_2d":[0,0,0,0]}

Não invente coordenadas.
Não confunda a barra azul com a verde.`
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

    const conteudo =
      dados.choices?.[0]?.message?.content || "";

    const inicio = conteudo.indexOf("{");
    const fim = conteudo.lastIndexOf("}");

    if (inicio === -1 || fim === -1) {
      throw new Error("A IA não retornou um JSON válido.");
    }

    const resultado = JSON.parse(
      conteudo.substring(inicio, fim + 1)
    );

    const caixa = resultado.box_2d;

    if (
      resultado.found !== true ||
      !Array.isArray(caixa) ||
      caixa.length !== 4 ||
      !caixa.every(
        n => Number.isInteger(n) && n >= 0 && n <= 1000
      )
    ) {
      return res.json({
        found: false,
        box_2d: [0, 0, 0, 0]
      });
    }

    res.json({
      found: true,
      box_2d: caixa
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
