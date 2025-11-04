document.addEventListener('DOMContentLoaded', () => {

    // --- ESTADO DA APLICAÇÃO ---
    let currentPlatform = 'ml'; // 'ml', 'amazon', 'shopee', 'aliexpress', 'vd'
    let currentCalcMode = 'margin'; // 'margin' ou 'price'

    // --- SELETORES DE ELEMENTOS ---
    const form = document.getElementById('price-calculator');
    const platformTabs = document.querySelectorAll('#platform-tabs .tab-button');
    const calcModeTabs = document.querySelectorAll('#calc-mode-tabs .tab-button');
    const calcInputsContainer = document.getElementById('calc-inputs-container');
    
    // Inputs específicos
    const mlInputs = document.getElementById('ml-inputs');
    const amazonInputs = document.getElementById('amazon-inputs');
    const shopeeInputs = document.getElementById('shopee-inputs');
    const aliexpressInputs = document.getElementById('aliexpress-inputs'); // Adicionado
    
    // Resultados
    const resultsContainer = document.getElementById('results-container');
    const resultsGrid = document.getElementById('results-grid');
    const resultClassic = document.getElementById('result-classic');
    const resultPremium = document.getElementById('result-premium');
    const resultAmazon = document.getElementById('result-amazon');
    const resultShopeeSemFrete = document.getElementById('result-shopee-sem-frete');
    const resultShopeeComFrete = document.getElementById('result-shopee-com-frete');
    const resultAliexpress = document.getElementById('result-aliexpress'); // Adicionado
    const resultDirect = document.getElementById('result-direct');
    const allResultCards = document.querySelectorAll('[data-result-card]');

    // --- FORMATAÇÃO ---
    const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);

    const formatPercent = (value) => new Intl.NumberFormat('pt-BR', {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);

    const getInputValue = (id) => parseFloat(document.getElementById(id).value) || 0;

    // --- LÓGICA DE UI ---
    
    // Troca de Plataforma
    platformTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            platformTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentPlatform = tab.dataset.platform;
            
            // Mostra/oculta inputs de taxas específicas
            document.querySelectorAll('[data-platform-inputs]').forEach(el => {
                el.style.display = 'none';
            });
            const activeInputs = document.getElementById(`${currentPlatform}-inputs`);
            if (activeInputs) {
                activeInputs.style.display = 'grid';
            }
            
            // Esconde resultados ao trocar de plataforma
            resultsContainer.style.display = 'none'; 
        });
    });

    // Troca de Modo de Cálculo (Margem/Preço)
    calcModeTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            calcModeTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentCalcMode = tab.dataset.mode;

            document.querySelectorAll('.calc-mode-input').forEach(inputDiv => {
                inputDiv.style.display = 'none';
            });
            document.getElementById(`mode-${currentCalcMode}`).style.display = 'block';
            
            form.querySelector('.cta-button').textContent = currentCalcMode === 'margin' ? 'Calcular Margem' : 'Calcular Preço';
        });
    });

    // --- LÓGICA DE CÁLCULO ---
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // 1. Coletar custos base
        const inputs = {
            custoProduto: getInputValue('custo-produto'),
            custoAdicional: getInputValue('custo-adicional'),
            frete: getInputValue('frete'),
            impostoPerc: getInputValue('imposto-percent') / 100,
            // ML
            taxaClassicoPerc: getInputValue('taxa-classico-percent') / 100,
            taxaPremiumPerc: getInputValue('taxa-premium-percent') / 100,
            // Amazon
            taxaAmazonPerc: getInputValue('taxa-amazon-percent') / 100,
            // Shopee
            taxaShopeeBasePerc: getInputValue('taxa-shopee-base-percent') / 100,
            taxaShopeeAdicPerc: getInputValue('taxa-shopee-adic-percent') / 100,
            limiteComissaoShopee: getInputValue('limite-comissao-shopee'),
            taxaFixaShopee: getInputValue('taxa-fixa-shopee'),
            // Aliexpress (Adicionado)
            taxaAliexpressPerc: getInputValue('taxa-aliexpress-select') / 100,
        };
        
        // Reseta a UI de resultados
        allResultCards.forEach(c => c.style.display = 'none');
        resultsGrid.classList.remove('single-column');
        
        // 2. Executar cálculos com base na plataforma
        if (currentPlatform === 'ml') {
            resultsGrid.classList.remove('single-column');
            let classicResult, premiumResult;
            
            if (currentCalcMode === 'margin') {
                const precoVenda = getInputValue('preco-venda');
                if (precoVenda <= 0) { console.error("Insira um Preço de Venda válido."); return; }
                classicResult = calculateMargin(precoVenda, inputs, inputs.taxaClassicoPerc, 0, 0);
                premiumResult = calculateMargin(precoVenda, inputs, inputs.taxaPremiumPerc, 0, 0);
            } else {
                const margemDesejada = getInputValue('margem-desejada');
                if (margemDesejada <= 0) { console.error("Insira uma Margem Desejada válida."); return; }
                classicResult = calculatePrice(margemDesejada, inputs, inputs.taxaClassicoPerc, 0, 0);
                premiumResult = calculatePrice(margemDesejada, inputs, inputs.taxaPremiumPerc, 0, 0);
            }
            
            updateResultCard(resultClassic, classicResult);
            updateResultCard(resultPremium, premiumResult);
            resultClassic.style.display = 'block';
            resultPremium.style.display = 'block';

        } else if (currentPlatform === 'amazon') {
            resultsGrid.classList.add('single-column');
            let amazonResult;
            
            if (currentCalcMode === 'margin') {
                const precoVenda = getInputValue('preco-venda');
                if (precoVenda <= 0) { console.error("Insira um Preço de Venda válido."); return; }
                amazonResult = calculateMargin(precoVenda, inputs, inputs.taxaAmazonPerc, 0, 0);
            } else {
                const margemDesejada = getInputValue('margem-desejada');
                if (margemDesejada <= 0) { console.error("Insira uma Margem Desejada válida."); return; }
                amazonResult = calculatePrice(margemDesejada, inputs, inputs.taxaAmazonPerc, 0, 0);
            }
            
            updateResultCard(resultAmazon, amazonResult);
            resultAmazon.style.display = 'block';

        } else if (currentPlatform === 'shopee') {
            resultsGrid.classList.remove('single-column');
            
            const taxaSemFretePerc = inputs.taxaShopeeBasePerc;
            const taxaComFretePerc = inputs.taxaShopeeBasePerc + inputs.taxaShopeeAdicPerc;
            const taxaFixa = inputs.taxaFixaShopee;
            const limiteComissao = inputs.limiteComissaoShopee;

            let resultSemFrete, resultComFrete;
            
            if (currentCalcMode === 'margin') {
                const precoVenda = getInputValue('preco-venda');
                if (precoVenda <= 0) { console.error("Insira um Preço de Venda válido."); return; }
                resultSemFrete = calculateMargin(precoVenda, inputs, taxaSemFretePerc, taxaFixa, limiteComissao);
                resultComFrete = calculateMargin(precoVenda, inputs, taxaComFretePerc, taxaFixa, limiteComissao);
            } else {
                const margemDesejada = getInputValue('margem-desejada');
                if (margemDesejada <= 0) { console.error("Insira uma Margem Desejada válida."); return; }
                resultSemFrete = calculatePrice(margemDesejada, inputs, taxaSemFretePerc, taxaFixa, limiteComissao);
                resultComFrete = calculatePrice(margemDesejada, inputs, taxaComFretePerc, taxaFixa, limiteComissao);
            }
            
            updateResultCard(resultShopeeSemFrete, resultSemFrete);
            updateResultCard(resultShopeeComFrete, resultComFrete);
            resultShopeeSemFrete.style.display = 'block';
            resultShopeeComFrete.style.display = 'block';

        } else if (currentPlatform === 'aliexpress') {
            // --- MODO ALIEXPRESS (Adicionado) ---
            resultsGrid.classList.add('single-column'); // Força 1 coluna
            
            let aliexpressResult;
            const taxaAnuncioAliexpress = inputs.taxaAliexpressPerc; // Usa a taxa do select
            
            if (currentCalcMode === 'margin') {
                const precoVenda = getInputValue('preco-venda');
                if (precoVenda <= 0) { console.error("Insira um Preço de Venda válido."); return; }
                // (precoVenda, inputs, taxaPerc, taxaFixa, limiteComissao)
                aliexpressResult = calculateMargin(precoVenda, inputs, taxaAnuncioAliexpress, 0, 0);
            } else {
                const margemDesejada = getInputValue('margem-desejada');
                if (margemDesejada <= 0) { console.error("Insira uma Margem Desejada válida."); return; }
                aliexpressResult = calculatePrice(margemDesejada, inputs, taxaAnuncioAliexpress, 0, 0);
            }
            
            updateResultCard(resultAliexpress, aliexpressResult);
            resultAliexpress.style.display = 'block';

        } else if (currentPlatform === 'vd') {
            resultsGrid.classList.add('single-column');
            let directResult;
            
            if (currentCalcMode === 'margin') {
                const precoVenda = getInputValue('preco-venda');
                if (precoVenda <= 0) { console.error("Insira um Preço de Venda válido."); return; }
                directResult = calculateMargin(precoVenda, inputs, 0, 0, 0);
            } else {
                const margemDesejada = getInputValue('margem-desejada');
                if (margemDesejada <= 0) { console.error("Insira uma Margem Desejada válida."); return; }
                directResult = calculatePrice(margemDesejada, inputs, 0, 0, 0);
            }
            
            updateResultCard(resultDirect, directResult);
            resultDirect.style.display = 'block';
        }

        // 3. Exibir container de resultados
        resultsContainer.style.display = 'block';
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
    });

    /**
     * Calcula a margem com base no preço de venda.
     * Função atualizada para incluir taxaFixa e limiteComissao.
     */
    function calculateMargin(precoVenda, inputs, taxaAnuncioPerc, taxaFixa = 0, limiteComissao = 0) {
        // Cálculo da Taxa de Anúncio (Comissão)
        let taxaAnuncioPercentual = precoVenda * taxaAnuncioPerc;
        if (limiteComissao > 0 && taxaAnuncioPercentual > limiteComissao) {
            taxaAnuncioPercentual = limiteComissao;
        }
        const taxaAnuncio = taxaAnuncioPercentual + taxaFixa;
        
        // Outros custos
        const imposto = precoVenda * inputs.impostoPerc;
        
        const custoTotal = inputs.custoProduto + 
                           inputs.custoAdicional + 
                           inputs.frete + 
                           taxaAnuncio + 
                           imposto;
                           
        const margem = precoVenda - custoTotal;

        return {
            precoVenda: precoVenda,
            taxaAnuncio: taxaAnuncio,
            frete: inputs.frete,
            custoProduto: inputs.custoProduto,
            custoAdicional: inputs.custoAdicional,
            imposto: imposto,
            custoTotal: custoTotal,
            margem: margem
        };
    }

    /**
     * Calcula o preço de venda com base na margem desejada.
     * Função atualizada para incluir taxaFixa e limiteComissao.
     */
    function calculatePrice(margemDesejada, inputs, taxaAnuncioPerc, taxaFixa = 0, limiteComissao = 0) {
        
        // --- Cálculo assumindo que o limite NÃO é atingido ---
        // Custos fixos = Produto + Adicional + Frete + Taxa Fixa
        const custosFixosBase = inputs.custoProduto + inputs.custoAdicional + inputs.frete + taxaFixa;
        // Custos percentuais = Taxa Anúncio % + Imposto %
        const percVariaveisBase = taxaAnuncioPerc + inputs.impostoPerc; 

        if (percVariaveisBase >= 1) {
            console.error("A soma das taxas de anúncio e impostos é 100% ou mais.");
            return { precoVenda: 0, taxaAnuncio: 0, frete: 0, custoProduto: 0, custoAdicional: 0, imposto: 0, custoTotal: 0, margem: 0 };
        }

        // Preço Provisório = (Custos Fixos + Margem) / (1 - Custos Percentuais)
        const precoVendaProvisorio = (custosFixosBase + margemDesejada) / (1 - percVariaveisBase);

        // Verifica se o limite de comissão foi atingido
        if (limiteComissao > 0 && (precoVendaProvisorio * taxaAnuncioPerc) > limiteComissao) {
            // --- O Limite FOI atingido. Recalcula ---
            // A comissão vira um custo fixo (Limite + Taxa Fixa)
            const custosFixosComLimite = inputs.custoProduto + inputs.custoAdicional + inputs.frete + taxaFixa + limiteComissao;
            // O único custo percentual agora é o imposto
            const percVariaveisComLimite = inputs.impostoPerc;

            if (percVariaveisComLimite >= 1) {
                 console.error("A soma das taxas de impostos é 100% ou mais.");
                 return { precoVenda: 0, taxaAnuncio: 0, frete: 0, custoProduto: 0, custoAdicional: 0, imposto: 0, custoTotal: 0, margem: 0 };
            }
            
            const precoVendaFinal = (custosFixosComLimite + margemDesejada) / (1 - percVariaveisComLimite);
            // Retorna o cálculo de margem com o preço final encontrado
            return calculateMargin(precoVendaFinal, inputs, taxaAnuncioPerc, taxaFixa, limiteComissao);

        } else {
            // --- O Limite NÃO foi atingido ---
            // O preço provisório está correto
            // Retorna o cálculo de margem com o preço provisório
            return calculateMargin(precoVendaProvisorio, inputs, taxaAnuncioPerc, taxaFixa, limiteComissao);
        }
    }

    /**
     * Atualiza um card de resultado com os dados calculados.
     */
    function updateResultCard(cardElement, data) {
        const setField = (field, value, formatFn) => {
            const el = cardElement.querySelector(`[data-field="${field}"]`);
            if (el) el.textContent = formatFn(value);
        };
        
        const precoVenda = data.precoVenda;

        // Valores em R$
        setField('taxa-anuncio-valor', data.taxaAnuncio, formatCurrency);
        setField('frete-valor', data.frete, formatCurrency);
        setField('custo-produto-valor', data.custoProduto, formatCurrency);
        setField('custo-adicional-valor', data.custoAdicional, formatCurrency);
        setField('imposto-valor', data.imposto, formatCurrency);
        setField('custo-total-valor', data.custoTotal, formatCurrency);
        setField('margem-valor', data.margem, formatCurrency);
        setField('preco-venda-final', precoVenda, formatCurrency);

        // Valores em %
        if (precoVenda > 0) {
            setField('taxa-anuncio-perc', data.taxaAnuncio / precoVenda, formatPercent);
            setField('frete-perc', data.frete / precoVenda, formatPercent);
            setField('custo-produto-perc', data.custoProduto / precoVenda, formatPercent);
            setField('custo-adicional-perc', data.custoAdicional / precoVenda, formatPercent);
            setField('imposto-perc', data.imposto / precoVenda, formatPercent);
            setField('custo-total-perc', data.custoTotal / precoVenda, formatPercent);
            setField('margem-perc', data.margem / precoVenda, formatPercent);
        } else {
            // Zera percentuais se o preço for 0
            setField('taxa-anuncio-perc', 0, formatPercent);
            setField('frete-perc', 0, formatPercent);
            setField('custo-produto-perc', 0, formatPercent);
            setField('custo-adicional-perc', 0, formatPercent);
            setField('imposto-perc', 0, formatPercent);
            setField('custo-total-perc', 0, formatPercent);
            setField('margem-perc', 0, formatPercent);
        }
    }
});

