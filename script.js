// script.js
// Consome a countries.dev API (https://countries.dev) — sem chave, sem cadastro, JSON via HTTPS, CORS liberado.
// Obs.: a REST Countries (restcountries.com) passou a exigir chave de API na versão atual (v5),
// por isso trocamos para a countries.dev, que oferece os mesmos dados sem autenticação.

const form = document.getElementById("form-busca");
const campoBusca = document.getElementById("campo-busca");
const areaResultado = document.getElementById("resultado");
const chips = document.getElementById("sugestoes");

// Formata número grande (ex.: população) no padrão brasileiro
function formatarNumero(numero) {
  return new Intl.NumberFormat("pt-BR").format(numero);
}

// Extrai os idiomas do array retornado pela API em uma string legível
function formatarIdiomas(languages) {
  if (!languages || languages.length === 0) return "Não informado";
  return languages.map((idioma) => idioma.name).join(", ");
}

// Extrai as moedas (nome + símbolo) em uma string legível
function formatarMoedas(currencies) {
  if (!currencies || currencies.length === 0) return "Não informado";
  return currencies
    .map((moeda) => `${moeda.name}${moeda.symbol ? " (" + moeda.symbol + ")" : ""}`)
    .join(", ");
}

function montarCartao(pais) {
  const nomeComum = pais.name || "—";
  const nomeNativo = pais.nativeName && pais.nativeName !== pais.name ? pais.nativeName : "";
  const capital = pais.capital || "Não possui";
  const populacao = typeof pais.population === "number" ? formatarNumero(pais.population) : "Não informado";
  const regiao = [pais.region, pais.subregion].filter(Boolean).join(" · ") || "Não informado";
  const idiomas = formatarIdiomas(pais.languages);
  const moedas = formatarMoedas(pais.currencies);
  const fuso = pais.timezones?.[0] || "Não informado";
  const bandeira = pais.flags?.svg || pais.flags?.png || "";
  const bandeiraAlt = `Bandeira de ${nomeComum}`;

  areaResultado.innerHTML = `
    <article class="cartao-pais">
      <img class="bandeira" src="${bandeira}" alt="${bandeiraAlt}">
      <div class="cabecalho">
        <h2>${nomeComum}</h2>
        ${nomeNativo ? `<span class="nome-nativo">${nomeNativo}</span>` : ""}
      </div>
      <div class="dados">
        <div class="dado">
          <span class="rotulo">Capital</span>
          <span class="valor">${capital}</span>
        </div>
        <div class="dado">
          <span class="rotulo">População</span>
          <span class="valor">${populacao}</span>
        </div>
        <div class="dado">
          <span class="rotulo">Região</span>
          <span class="valor">${regiao}</span>
        </div>
        <div class="dado">
          <span class="rotulo">Fuso horário</span>
          <span class="valor">${fuso}</span>
        </div>
        <div class="dado">
          <span class="rotulo">Idiomas</span>
          <span class="valor">${idiomas}</span>
        </div>
        <div class="dado">
          <span class="rotulo">Moeda</span>
          <span class="valor">${moedas}</span>
        </div>
      </div>
    </article>
  `;
}

function mostrarCarregando() {
  areaResultado.innerHTML = `<p class="carregando">Buscando...</p>`;
}

function mostrarErro(mensagem) {
  areaResultado.innerHTML = `<p class="erro">${mensagem}</p>`;
}

async function buscarPais(termo) {
  if (!termo) return;
  mostrarCarregando();

  try {
    const resposta = await fetch(
      `https://countries.dev/name/${encodeURIComponent(termo)}`
    );

    if (resposta.status === 404) {
      mostrarErro(`Nenhum país encontrado para "${termo}". Verifique a grafia e tente novamente.`);
      return;
    }

    if (!resposta.ok) {
      throw new Error(`Erro HTTP ${resposta.status}`);
    }

    const dados = await resposta.json();

    if (!Array.isArray(dados) || dados.length === 0) {
      mostrarErro(`Nenhum país encontrado para "${termo}".`);
      return;
    }

    // Quando a busca retorna mais de um resultado (ex.: "guin" -> Guiné, Guiné-Bissau),
    // mostramos o primeiro e avisamos que há outros.
    montarCartao(dados[0]);

    if (dados.length > 1) {
      const outros = dados
        .slice(1, 4)
        .map((p) => p.name)
        .filter(Boolean)
        .join(", ");
      if (outros) {
        areaResultado.insertAdjacentHTML(
          "beforeend",
          `<p class="placeholder" style="margin-top:0.8rem;">Outros resultados para essa busca: ${outros}.</p>`
        );
      }
    }
  } catch (erro) {
    console.error("Falha ao buscar país:", erro);
    mostrarErro("Não foi possível falar com a API agora. Verifique sua conexão e tente novamente em instantes.");
  }
}

form.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const termo = campoBusca.value.trim();
  if (!termo) {
    mostrarErro("Digite o nome de um país para buscar.");
    return;
  }
  buscarPais(termo);
});

chips.addEventListener("click", (evento) => {
  const chip = evento.target.closest(".chip");
  if (!chip) return;
  const pais = chip.dataset.pais;
  campoBusca.value = pais;
  buscarPais(pais);
});
