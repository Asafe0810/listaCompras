// Aguarda o carregamento completo do DOM antes de executar o código
document.addEventListener('DOMContentLoaded', function() {
    // ========== SELEÇÃO DE ELEMENTOS ==========
    // Campo de entrada para novos itens
    const itemInput = document.getElementById('itemInput');
    // Botão para adicionar itens
    const addButton = document.getElementById('addButton');
    // Lista UL onde os itens serão renderizados
    const listaCompras = document.getElementById('listaCompras');
    // Todos os botões de filtro
    const filterButtons = document.querySelectorAll('.filter-btn');
    // Elemento para mostrar total de itens
    const totalItemsSpan = document.getElementById('totalItems');
    // Elemento para mostrar itens completados
    const completedItemsSpan = document.getElementById('completedItems');
    // Botão para alternar modo escuro
    const toggleDarkModeBtn = document.getElementById('toggleDarkMode');

    // ========== VARIÁVEIS DE ESTADO ==========
    // Controla o filtro atual (all, completed ou pending)
    let currentFilter = 'all';
    // Controla o estado do modo escuro
    let darkMode = false;

    // ========== INICIALIZAÇÃO ==========
    // Carrega itens do localStorage
    carregarItens();
    // Atualiza os contadores de itens
    atualizarEstatisticas();
    // Verifica e aplica o modo escuro salvo
    verificarModoEscuro();

    // ========== EVENT LISTENERS ==========
    // Adiciona item quando o botão é clicado
    addButton.addEventListener('click', adicionarItem);
    
    // Adiciona item quando Enter é pressionado
    itemInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') adicionarItem();
    });
    
    // Configura os botões de filtro
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove a classe 'active' de todos os botões
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Adiciona 'active' apenas ao botão clicado
            this.classList.add('active');
            
            // Atualiza o filtro atual
            currentFilter = this.dataset.filter;
            
            // Aplica o novo filtro
            filtrarItens();
        });
    });

    // Alterna o modo escuro quando o botão é clicado
    toggleDarkModeBtn.addEventListener('click', alternarModoEscuro);

    // ========== FUNÇÕES PRINCIPAIS ==========
    // Função para adicionar um novo item
    function adicionarItem() {
        // Obtém e limpa o texto do campo de entrada
        const itemTexto = itemInput.value.trim();
        
        // Verifica se o texto não está vazio
        if (itemTexto) {
            // Remove mensagem de lista vazia se existir
            if (listaCompras.querySelector('.empty-message')) {
                listaCompras.innerHTML = '';
            }
            
            // Cria um objeto representando o novo item
            const novoItem = {
                id: Date.now(),             // ID único baseado no timestamp
                texto: itemTexto,           // Texto do item
                completado: false,           // Status inicial
                dataCriacao: new Date().toISOString() // Data de criação
            };
            
            // Adiciona o item visualmente na lista
            adicionarItemNaLista(novoItem);
            
            // Salva o item no localStorage
            salvarItem(novoItem);
            
            // Limpa o campo de entrada
            itemInput.value = '';
            
            // Coloca o foco de volta no campo
            itemInput.focus();
            
            // Atualiza os contadores
            atualizarEstatisticas();
        }
    }

    // Função para adicionar um item visualmente na lista
    function adicionarItemNaLista(item) {
        // Cria um novo elemento LI
        const li = document.createElement('li');
        
        // Define o ID do item como atributo data
        li.dataset.id = item.id;
        
        // Adiciona classe 'completed' se o item estiver completado
        if (item.completado) li.classList.add('completed');
        
        // Define o HTML interno do LI
        li.innerHTML = `
            <button class="action-btn complete-btn">
                <i class="fas fa-${item.completado ? 'check-circle' : 'circle'}"></i>
            </button>
            <span class="item-text">${item.texto}</span>
            <button class="action-btn delete-btn">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        // Adiciona evento para marcar/desmarcar como completado
        li.querySelector('.complete-btn').addEventListener('click', function() {
            alternarItemCompletado(item.id);
        });
        
        // Adiciona evento para remover o item
        li.querySelector('.delete-btn').addEventListener('click', function() {
            removerItem(item.id);
            li.remove();
            verificarListaVazia();
            atualizarEstatisticas();
        });
        
        // Adiciona o LI à lista UL
        listaCompras.appendChild(li);
    }

    // Função para alternar o status de completado de um item
    function alternarItemCompletado(id) {
        // Obtém todos os itens do localStorage
        let itens = obterItensStorage();
        
        // Encontra o índice do item
        const itemIndex = itens.findIndex(item => item.id === id);
        
        // Se o item foi encontrado
        if (itemIndex !== -1) {
            // Inverte o status de completado
            itens[itemIndex].completado = !itens[itemIndex].completado;
            
            // Atualiza o localStorage
            localStorage.setItem('listaCompras', JSON.stringify(itens));
            
            // Atualiza a visualização
            const li = document.querySelector(`li[data-id="${id}"]`);
            li.classList.toggle('completed');
            li.querySelector('.complete-btn i').className = 
                itens[itemIndex].completado ? 'fas fa-check-circle' : 'fas fa-circle';
            
            // Atualiza os contadores
            atualizarEstatisticas();
            
            // Reaplica o filtro se necessário
            if (currentFilter !== 'all') filtrarItens();
        }
    }

    // Função para remover um item do localStorage
    function removerItem(id) {
        // Obtém todos os itens
        let itens = obterItensStorage();
        
        // Filtra removendo o item com o ID correspondente
        itens = itens.filter(item => item.id !== id);
        
        // Atualiza o localStorage
        localStorage.setItem('listaCompras', JSON.stringify(itens));
    }

    // Função para carregar itens do localStorage
    function carregarItens() {
        // Obtém itens do localStorage
        const itens = obterItensStorage();
        
        // Se não houver itens, mostra mensagem
        if (itens.length === 0) {
            mostrarListaVazia();
        } else {
            // Adiciona cada item na lista
            itens.forEach(item => adicionarItemNaLista(item));
        }
    }

    // Função para filtrar itens com base no filtro atual
    function filtrarItens() {
        // Obtém todos os itens
        const itens = obterItensStorage();
        
        // Limpa a lista visual
        listaCompras.innerHTML = '';
        
        // Filtra os itens com base no filtro atual
        const itensFiltrados = itens.filter(item => {
            if (currentFilter === 'all') return true;
            if (currentFilter === 'completed') return item.completado;
            if (currentFilter === 'pending') return !item.completado;
            return true;
        });
        
        // Se não houver itens após filtrar, mostra mensagem
        if (itensFiltrados.length === 0) {
            mostrarListaVazia();
        } else {
            // Adiciona cada item filtrado
            itensFiltrados.forEach(item => adicionarItemNaLista(item));
        }
    }

    // Função para mostrar mensagem de lista vazia
    function mostrarListaVazia() {
        // Define o HTML com mensagem baseada no filtro
        listaCompras.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-shopping-basket"></i>
                <h3>Lista vazia</h3>
                <p>${currentFilter === 'all' ? 'Adicione itens à sua lista de compras' : 
                  currentFilter === 'completed' ? 'Nenhum item comprado ainda' : 
                  'Todos os itens foram comprados!'}</p>
            </div>
        `;
    }

    // Função para verificar se a lista ficou vazia
    function verificarListaVazia() {
        const itens = obterItensStorage();
        if (itens.length === 0) {
            mostrarListaVazia();
        }
    }

    // Função para atualizar os contadores de itens
    function atualizarEstatisticas() {
        // Obtém todos os itens
        const itens = obterItensStorage();
        
        // Calcula totais
        const total = itens.length;
        const completados = itens.filter(item => item.completado).length;
        
        // Atualiza os elementos DOM
        totalItemsSpan.textContent = `${total} ${total === 1 ? 'item' : 'itens'}`;
        completedItemsSpan.textContent = `${completados} comprados`;
    }

    // ========== FUNÇÕES DO MODO ESCURO ==========
    // Função para alternar entre modo escuro e claro
    function alternarModoEscuro() {
        // Inverte o estado do modo escuro
        darkMode = !darkMode;
        
        // Aplica ou remove a classe dark-mode do body
        document.body.classList.toggle('dark-mode', darkMode);
        
        // Atualiza o ícone do botão
        toggleDarkModeBtn.innerHTML = `<i class="fas fa-${darkMode ? 'sun' : 'moon'}"></i>`;
        
        // Salva a preferência no localStorage
        localStorage.setItem('darkMode', darkMode);
    }

    // Função para verificar e aplicar o modo escuro salvo
    function verificarModoEscuro() {
        // Obtém a preferência do localStorage
        const savedMode = localStorage.getItem('darkMode');
        
        // Se existir uma preferência salva
        if (savedMode !== null) {
            // Converte para booleano
            darkMode = savedMode === 'true';
            
            // Aplica o modo escuro se necessário
            if (darkMode) {
                document.body.classList.add('dark-mode');
                toggleDarkModeBtn.innerHTML = '<i class="fas fa-sun"></i>';
            }
        }
    }

    // ========== FUNÇÕES AUXILIARES ==========
    // Obtém todos os itens do localStorage
    function obterItensStorage() {
        return JSON.parse(localStorage.getItem('listaCompras')) || [];
    }

    // Salva um novo item no localStorage
    function salvarItem(item) {
        let itens = obterItensStorage();
        itens.push(item);
        localStorage.setItem('listaCompras', JSON.stringify(itens));
    }
});