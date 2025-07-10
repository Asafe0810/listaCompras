// Aguarda o carregamento completo do DOM antes de executar o código
// Isso garante que todos os elementos HTML estejam disponíveis antes que o JavaScript tente acessá-los
document.addEventListener('DOMContentLoaded', function() {
    // ========== SELEÇÃO DE ELEMENTOS ==========
    // Campo de entrada para novos itens - seleciona o elemento com ID 'entradaItem'
    const entradaItem = document.getElementById('entradaItem');
    // Botão para adicionar itens - seleciona o elemento com ID 'botaoAdicionar'
    const botaoAdicionar = document.getElementById('botaoAdicionar');
    // Lista UL onde os itens serão renderizados - seleciona o elemento com ID 'listaCompras'
    const listaCompras = document.getElementById('listaCompras');
    // Todos os botões de filtro - seleciona todos os elementos com classe 'botao-filtro'
    const botoesFiltro = document.querySelectorAll('.botao-filtro');
    // Elemento para mostrar total de itens - seleciona o elemento com ID 'totalItens'
    const totalItensSpan = document.getElementById('totalItens');
    // Elemento para mostrar itens completados - seleciona o elemento com ID 'itensComprados'
    const itensCompradosSpan = document.getElementById('itensComprados');
    // Botão para alternar modo escuro - seleciona o elemento com ID 'alternarModoEscuro'
    const alternarModoEscuroBtn = document.getElementById('alternarModoEscuro');

    // ========== VARIÁVEIS DE ESTADO ==========
    // Controla o filtro atual (todos, comprados ou pendentes) - valor inicial 'todos' (mostra todos os itens)
    let filtroAtual = 'todos';
    // Controla o estado do modo escuro - valor inicial false (modo claro ativo)
    let modoEscuro = false;

    // ========== INICIALIZAÇÃO ==========
    // Carrega itens do localStorage quando a página é carregada
    carregarItens();
    // Atualiza os contadores de itens (total e completados)
    atualizarEstatisticas();
    // Verifica se o modo escuro estava ativo na última sessão e aplica se necessário
    verificarModoEscuro();

    // ========== EVENT LISTENERS ==========
    // Adiciona um listener de evento de clique no botão de adicionar
    botaoAdicionar.addEventListener('click', adicionarItem);
    
    // Adiciona um listener de evento de tecla pressionada no campo de entrada
    // Permite adicionar itens pressionando Enter
    entradaItem.addEventListener('keypress', function(e) {
        // Verifica se a tecla pressionada foi Enter (key === 'Enter')
        if (e.key === 'Enter') adicionarItem();
    });
    
    // Configura os botões de filtro - adiciona listeners a cada um deles
    botoesFiltro.forEach(botao => {
        botao.addEventListener('click', function() {
            // Remove a classe 'ativo' de todos os botões de filtro
            botoesFiltro.forEach(btn => btn.classList.remove('ativo'));
            
            // Adiciona 'ativo' apenas ao botão clicado para destacá-lo visualmente
            this.classList.add('ativo');
            
            // Atualiza o filtro atual com o valor do atributo data-filtro do botão clicado
            filtroAtual = this.dataset.filtro;
            
            // Aplica o novo filtro para mostrar apenas os itens relevantes
            filtrarItens();
        });
    });

    // Adiciona listener para o botão de alternar modo escuro
    alternarModoEscuroBtn.addEventListener('click', alternarModoEscuro);

    // ========== FUNÇÕES PRINCIPAIS ==========
    // Função para adicionar um novo item à lista
    function adicionarItem() {
        // Obtém o valor do campo de entrada e remove espaços em branco no início/fim
        const textoItem = entradaItem.value.trim();
        
        // Verifica se o texto não está vazio (após o trim)
        if (textoItem) {
            // Remove mensagem de lista vazia se existir (quando adicionamos o primeiro item)
            if (listaCompras.querySelector('.mensagem-vazia')) {
                listaCompras.innerHTML = ''; // Limpa todo o conteúdo da lista
            }
            
            // Cria um objeto representando o novo item com todas as propriedades necessárias
            const novoItem = {
                id: Date.now(),             // ID único baseado no timestamp atual
                texto: textoItem,           // Texto do item fornecido pelo usuário
                completado: false,          // Status inicial (não completado)
                dataCriacao: new Date().toISOString() // Data de criação em formato ISO
            };
            
            // Adiciona o item visualmente na lista (DOM)
            adicionarItemNaLista(novoItem);
            
            // Salva o item no localStorage para persistência
            salvarItem(novoItem);
            
            // Limpa o campo de entrada para preparar para um novo item
            entradaItem.value = '';
            
            // Coloca o foco de volta no campo para facilitar a digitação do próximo item
            entradaItem.focus();
            
            // Atualiza os contadores de itens (total e completados)
            atualizarEstatisticas();
        }
    }

    // Função para adicionar um item visualmente na lista (DOM)
    function adicionarItemNaLista(item) {
        // Cria um novo elemento LI (item de lista)
        const li = document.createElement('li');
        
        // Define o ID do item como atributo data para fácil referência posterior
        li.dataset.id = item.id;
        
        // Adiciona classe 'completado' se o item estiver marcado como completado
        if (item.completado) li.classList.add('completado');
        
        // Define o HTML interno do LI com botões e texto do item
        li.innerHTML = `
            <button class="botao-acao botao-completar">
                <i class="fas fa-${item.completado ? 'check-circle' : 'circle'}"></i>
            </button>
            <span class="texto-item">${item.texto}</span>
            <button class="botao-acao botao-remover">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        // Adiciona evento para marcar/desmarcar como completado ao botão de completar
        li.querySelector('.botao-completar').addEventListener('click', function() {
            alternarItemCompletado(item.id); // Chama função para alternar status
        });
        
        // Adiciona evento para remover o item ao botão de deletar
        li.querySelector('.botao-remover').addEventListener('click', function() {
            removerItem(item.id); // Remove do localStorage
            li.remove(); // Remove do DOM
            verificarListaVazia(); // Verifica se a lista ficou vazia após remoção
            atualizarEstatisticas(); // Atualiza os contadores
        });
        
        // Adiciona o LI à lista UL no DOM
        listaCompras.appendChild(li);
    }

    // Função para alternar o status de completado de um item
    function alternarItemCompletado(id) {
        // Obtém todos os itens do localStorage
        let itens = obterItensStorage();
        
        // Encontra o índice do item com o ID correspondente
        const indiceItem = itens.findIndex(item => item.id === id);
        
        // Verifica se o item foi encontrado (índice diferente de -1)
        if (indiceItem !== -1) {
            // Inverte o status de completado (true vira false e vice-versa)
            itens[indiceItem].completado = !itens[indiceItem].completado;
            
            // Atualiza o localStorage com o novo array de itens
            localStorage.setItem('listaCompras', JSON.stringify(itens));
            
            // Atualiza a visualização no DOM
            const li = document.querySelector(`li[data-id="${id}"]`);
            // Alterna a classe 'completado' no elemento LI
            li.classList.toggle('completado');
            // Atualiza o ícone do botão (círculo vazio ou com check)
            li.querySelector('.botao-completar i').className = 
                itens[indiceItem].completado ? 'fas fa-check-circle' : 'fas fa-circle';
            
            // Atualiza os contadores de itens
            atualizarEstatisticas();
            
            // Reaplica o filtro se não estiver mostrando todos os itens
            if (filtroAtual !== 'todos') filtrarItens();
        }
    }

    // Função para remover um item do localStorage
    function removerItem(id) {
        // Obtém todos os itens do localStorage
        let itens = obterItensStorage();
        
        // Filtra o array, mantendo apenas os itens com IDs diferentes do especificado
        itens = itens.filter(item => item.id !== id);
        
        // Atualiza o localStorage com o novo array (sem o item removido)
        localStorage.setItem('listaCompras', JSON.stringify(itens));
    }

    // Função para carregar itens do localStorage quando a página é carregada
    function carregarItens() {
        // Obtém itens do localStorage usando a função auxiliar
        const itens = obterItensStorage();
        
        // Verifica se não há itens armazenados
        if (itens.length === 0) {
            // Mostra mensagem de lista vazia
            mostrarListaVazia();
        } else {
            // Para cada item, adiciona visualmente na lista
            itens.forEach(item => adicionarItemNaLista(item));
        }
    }

    // Função para filtrar itens com base no filtro atual (todos, comprados, pendentes)
    function filtrarItens() {
        // Obtém todos os itens do localStorage
        const itens = obterItensStorage();
        
        // Limpa a lista visual (UL) para reenderizar apenas os itens filtrados
        listaCompras.innerHTML = '';
        
        // Filtra os itens com base no filtro atual
        const itensFiltrados = itens.filter(item => {
            if (filtroAtual === 'todos') return true; // Mostra todos os itens
            if (filtroAtual === 'comprados') return item.completado; // Mostra apenas completados
            if (filtroAtual === 'pendentes') return !item.completado; // Mostra apenas pendentes
            return true; // Padrão (mostra todos)
        });
        
        // Verifica se após filtrar não há itens para mostrar
        if (itensFiltrados.length === 0) {
            // Mostra mensagem de lista vazia específica para o filtro atual
            mostrarListaVazia();
        } else {
            // Adiciona cada item filtrado visualmente na lista
            itensFiltrados.forEach(item => adicionarItemNaLista(item));
        }
    }

    // Função para mostrar mensagem de lista vazia (personalizada por filtro)
    function mostrarListaVazia() {
        // Define o HTML com mensagem baseada no filtro atual
        listaCompras.innerHTML = `
            <div class="mensagem-vazia">
                <i class="fas fa-shopping-basket"></i>
                <h3>Lista vazia</h3>
                <p>${filtroAtual === 'todos' ? 'Adicione itens à sua lista de compras' : 
                  filtroAtual === 'comprados' ? 'Nenhum item comprado ainda' : 
                  'Todos os itens foram comprados!'}</p>
            </div>
        `;
    }

    // Função para verificar se a lista ficou vazia após remoção de itens
    function verificarListaVazia() {
        // Obtém todos os itens do localStorage
        const itens = obterItensStorage();
        // Se não houver itens, mostra a mensagem de lista vazia
        if (itens.length === 0) {
            mostrarListaVazia();
        }
    }

    // Função para atualizar os contadores de itens (total e completados)
    function atualizarEstatisticas() {
        // Obtém todos os itens do localStorage
        const itens = obterItensStorage();
        
        // Calcula totais:
        const total = itens.length; // Número total de itens
        const completados = itens.filter(item => item.completado).length; // Itens marcados como completados
        
        // Atualiza os elementos DOM com os valores calculados:
        // Formata o texto para singular/plural automaticamente
        totalItensSpan.textContent = `${total} ${total === 1 ? 'item' : 'itens'}`;
        itensCompradosSpan.textContent = `${completados} comprados`;
    }

    // ========== FUNÇÕES DO MODO ESCURO ==========
    // Função para alternar entre modo escuro e claro
    function alternarModoEscuro() {
        // Inverte o estado do modo escuro (true vira false e vice-versa)
        modoEscuro = !modoEscuro;
        
        // Aplica ou remove a classe dark-mode do body (toggle com segundo parâmetro)
        document.body.classList.toggle('dark-mode', modoEscuro);
        
        // Atualiza o ícone do botão (sol para modo escuro, lua para modo claro)
        alternarModoEscuroBtn.innerHTML = `<i class="fas fa-${modoEscuro ? 'sun' : 'moon'}"></i>`;
        
        // Salva a preferência no localStorage para persistir entre sessões
        localStorage.setItem('darkMode', modoEscuro);
    }

    // Função para verificar e aplicar o modo escuro salvo no localStorage
    function verificarModoEscuro() {
        // Obtém a preferência do modo escuro do localStorage
        const modoSalvo = localStorage.getItem('darkMode');
        
        // Verifica se existe uma preferência salva
        if (modoSalvo !== null) {
            // Converte a string salva para booleano ('true' vira true, 'false' vira false)
            modoEscuro = modoSalvo === 'true';
            
            // Se o modo escuro estava ativo na última sessão
            if (modoEscuro) {
                // Aplica a classe dark-mode ao body
                document.body.classList.add('dark-mode');
                // Atualiza o ícone do botão para sol (indicando que clicar voltará ao modo claro)
                alternarModoEscuroBtn.innerHTML = '<i class="fas fa-sun"></i>';
            }
        }
    }

    let totalCliques = parseInt (localStorage.getItem('totalCliques')) || 0;
    const contador = document.getElementById('contador');
    contador.textContent = totalCliques;
    document.getElementById('btnClique').addEventListener('click') , () =>{
    totalCliques++;
    contador.textContent = totalCliques;
    localStorage.setItem('totalcliques');
}

    // ========== FUNÇÕES AUXILIARES ==========
    // Função auxiliar para obter todos os itens do localStorage
    function obterItensStorage() {
        // Obtém os itens do localStorage (ou array vazio se não existir)
        return JSON.parse(localStorage.getItem('listaCompras')) || [];
    }

    // Função auxiliar para salvar um novo item no localStorage
    function salvarItem(item) {
        // Obtém todos os itens atuais
        let itens = obterItensStorage();
        // Adiciona o novo item ao array
        itens.push(item);
        // Salva o array atualizado no localStorage (convertido para string JSON)
        localStorage.setItem('listaCompras', JSON.stringify(itens));
    }
});