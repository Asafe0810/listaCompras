document.addEventListener('DOMContentLoaded', function() {
    // Elementos DOM
    const itemInput = document.getElementById('itemInput'); // Campo de entrada para novos itens
    const addButton = document.getElementById('addButton'); // Botão para adicionar itens
    const listaCompras = document.getElementById('listaCompras'); // Lista de compras (UL)
    const filterButtons = document.querySelectorAll('.filter-btn'); // Botões de filtro (All, Completed, Pending)
    const totalItemsSpan = document.getElementById('totalItems'); // Exibe o total de itens
    const completedItemsSpan = document.getElementById('completedItems'); // Exibe itens completados
    
    // Variáveis de estado
    let currentFilter = 'all'; // Filtro atual (padrão: 'all')
    
    // Inicialização
    carregarItens(); // Carrega itens do localStorage ao iniciar
    atualizarEstatisticas(); // Atualiza contadores de itens
    
    // Event Listeners

    // Adiciona um item quando o botão é clicado
    addButton.addEventListener('click', adicionarItem);
    
    // Adiciona um item quando a tecla Enter é pressionada no campo de entrada
    itemInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') adicionarItem();
    });
    
    // Configura os botões de filtro (All, Completed, Pending)
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove a classe 'active' de todos os botões
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Adiciona 'active' ao botão clicado
            this.classList.add('active');
            // Atualiza o filtro atual e aplica o filtro
            currentFilter = this.dataset.filter;
            filtrarItens();
        });
    });
    
    // Funções principais

    /**
     * Adiciona um novo item à lista de compras.
     * Verifica se o texto não está vazio, cria um objeto de item,
     * adiciona à lista visual e ao localStorage, e limpa o campo de entrada.
     */
    function adicionarItem() {
        const itemTexto = itemInput.value.trim();
        
        if (itemTexto) {
            // Remove mensagem de lista vazia se existir
            if (listaCompras.querySelector('.empty-message')) {
                listaCompras.innerHTML = '';
            }
            
            const novoItem = {
                id: Date.now(), // ID único baseado no timestamp
                texto: itemTexto, // Texto do item
                completado: false, // Status inicial (não completado)
                dataCriacao: new Date().toISOString() // Data de criação
            };
            
            adicionarItemNaLista(novoItem); // Adiciona visualmente
            salvarItem(novoItem); // Salva no localStorage
            itemInput.value = ''; // Limpa o campo
            itemInput.focus(); // Foca no campo novamente
            atualizarEstatisticas(); // Atualiza contadores
        }
    }
    
    /**
     * Cria e adiciona um elemento LI à lista de compras.
     * @param {Object} item - Objeto do item com id, texto e status.
     */
    function adicionarItemNaLista(item) {
        const li = document.createElement('li');
        li.dataset.id = item.id;
        if (item.completado) li.classList.add('completed'); // Adiciona classe se completado
        
        li.innerHTML = `
            <button class="action-btn complete-btn">
                <i class="fas fa-${item.completado ? 'check-circle' : 'circle'}"></i>
            </button>
            <span class="item-text">${item.texto}</span>
            <button class="action-btn delete-btn">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        // Event listener para marcar/desmarcar como completado
        li.querySelector('.complete-btn').addEventListener('click', function() {
            toggleItemCompleted(item.id);
        });
        
        // Event listener para remover o item
        li.querySelector('.delete-btn').addEventListener('click', function() {
            removerItem(item.id);
            li.remove(); // Remove visualmente
            verificarListaVazia(); // Verifica se a lista ficou vazia
            atualizarEstatisticas(); // Atualiza contadores
        });
        
        listaCompras.appendChild(li); // Adiciona à lista
    }
    
    /**
     * Alterna o status de completado de um item.
     * @param {number} id - ID do item.
     */
    function toggleItemCompleted(id) {
        let itens = obterItensStorage();
        const itemIndex = itens.findIndex(item => item.id === id);
        
        if (itemIndex !== -1) {
            itens[itemIndex].completado = !itens[itemIndex].completado; // Inverte o status
            localStorage.setItem('listaCompras', JSON.stringify(itens)); // Atualiza localStorage
            
            // Atualiza a visualização
            const li = document.querySelector(`li[data-id="${id}"]`);
            li.classList.toggle('completed');
            li.querySelector('.complete-btn i').className = 
                itens[itemIndex].completado ? 'fas fa-check-circle' : 'fas fa-circle';
            
            atualizarEstatisticas(); // Atualiza contadores
            if (currentFilter !== 'all') filtrarItens(); // Reaplica filtro se necessário
        }
    }
    
    /**
     * Remove um item do localStorage.
     * @param {number} id - ID do item.
     */
    function removerItem(id) {
        let itens = obterItensStorage();
        itens = itens.filter(item => item.id !== id); // Filtra o item removido
        localStorage.setItem('listaCompras', JSON.stringify(itens)); // Atualiza localStorage
    }
    
    /**
     * Carrega itens do localStorage e exibe na lista.
     * Mostra mensagem de lista vazia se não houver itens.
     */
    function carregarItens() {
        const itens = obterItensStorage();
        
        if (itens.length === 0) {
            mostrarListaVazia();
        } else {
            itens.forEach(item => adicionarItemNaLista(item));
        }
    }
    
    /**
     * Filtra os itens com base no filtro atual (All, Completed, Pending).
     * Atualiza a lista visualmente.
     */
    function filtrarItens() {
        const itens = obterItensStorage();
        listaCompras.innerHTML = ''; // Limpa a lista
        
        const itensFiltrados = itens.filter(item => {
            if (currentFilter === 'all') return true;
            if (currentFilter === 'completed') return item.completado;
            if (currentFilter === 'pending') return !item.completado;
            return true;
        });
        
        if (itensFiltrados.length === 0) {
            mostrarListaVazia(); // Mostra mensagem se não houver itens
        } else {
            itensFiltrados.forEach(item => adicionarItemNaLista(item)); // Adiciona itens filtrados
        }
    }
    
    /**
     * Exibe uma mensagem quando a lista está vazia.
     * A mensagem varia com base no filtro atual.
     */
    function mostrarListaVazia() {
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
    
    /**
     * Verifica se a lista está vazia após remover um item.
     * Se estiver vazia, exibe a mensagem apropriada.
     */
    function verificarListaVazia() {
        const itens = obterItensStorage();
        if (itens.length === 0) {
            mostrarListaVazia();
        }
    }
    
    /**
     * Atualiza os contadores de itens totais e completados.
     */
    function atualizarEstatisticas() {
        const itens = obterItensStorage();
        const total = itens.length;
        const completados = itens.filter(item => item.completado).length;
        
        totalItemsSpan.textContent = `${total} ${total === 1 ? 'item' : 'itens'}`;
        completedItemsSpan.textContent = `${completados} comprados`;
    }
    
    // Funções auxiliares

    /**
     * Obtém todos os itens do localStorage.
     * @returns {Array} Lista de itens ou array vazio se não houver dados.
     */
    function obterItensStorage() {
        return JSON.parse(localStorage.getItem('listaCompras')) || [];
    }
    
    /**
     * Salva um novo item no localStorage.
     * @param {Object} item - Objeto do item a ser salvo.
     */
    function salvarItem(item) {
        let itens = obterItensStorage();
        itens.push(item);
        localStorage.setItem('listaCompras', JSON.stringify(itens));
    }
});