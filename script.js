document.addEventListener('DOMContentLoaded', function() {
    // Elementos DOM
    const itemInput = document.getElementById('itemInput');
    const addButton = document.getElementById('addButton');
    const listaCompras = document.getElementById('listaCompras');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const totalItemsSpan = document.getElementById('totalItems');
    const completedItemsSpan = document.getElementById('completedItems');
    
    // Variáveis de estado
    let currentFilter = 'all';
    
    // Inicialização
    carregarItens();
    atualizarEstatisticas();
    
    // Event Listeners
    addButton.addEventListener('click', adicionarItem);
    itemInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') adicionarItem();
    });
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            filtrarItens();
        });
    });
    
    // Funções principais
    function adicionarItem() {
        const itemTexto = itemInput.value.trim();
        
        if (itemTexto) {
            // Remove mensagem de lista vazia se existir
            if (listaCompras.querySelector('.empty-message')) {
                listaCompras.innerHTML = '';
            }
            
            const novoItem = {
                id: Date.now(),
                texto: itemTexto,
                completado: false,
                dataCriacao: new Date().toISOString()
            };
            
            adicionarItemNaLista(novoItem);
            salvarItem(novoItem);
            itemInput.value = '';
            itemInput.focus();
            atualizarEstatisticas();
        }
    }
    
    function adicionarItemNaLista(item) {
        const li = document.createElement('li');
        li.dataset.id = item.id;
        if (item.completado) li.classList.add('completed');
        
        li.innerHTML = `
            <button class="action-btn complete-btn">
                <i class="fas fa-${item.completado ? 'check-circle' : 'circle'}"></i>
            </button>
            <span class="item-text">${item.texto}</span>
            <button class="action-btn delete-btn">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        // Event listeners para os botões
        li.querySelector('.complete-btn').addEventListener('click', function() {
            toggleItemCompleted(item.id);
        });
        
        li.querySelector('.delete-btn').addEventListener('click', function() {
            removerItem(item.id);
            li.remove();
            verificarListaVazia();
            atualizarEstatisticas();
        });
        
        listaCompras.appendChild(li);
    }
    
    function toggleItemCompleted(id) {
        let itens = obterItensStorage();
        const itemIndex = itens.findIndex(item => item.id === id);
        
        if (itemIndex !== -1) {
            itens[itemIndex].completado = !itens[itemIndex].completado;
            localStorage.setItem('listaCompras', JSON.stringify(itens));
            
            // Atualizar visualização
            const li = document.querySelector(`li[data-id="${id}"]`);
            li.classList.toggle('completed');
            li.querySelector('.complete-btn i').className = 
                itens[itemIndex].completado ? 'fas fa-check-circle' : 'fas fa-circle';
            
            atualizarEstatisticas();
            if (currentFilter !== 'all') filtrarItens();
        }
    }
    
    function removerItem(id) {
        let itens = obterItensStorage();
        itens = itens.filter(item => item.id !== id);
        localStorage.setItem('listaCompras', JSON.stringify(itens));
    }
    
    function carregarItens() {
        const itens = obterItensStorage();
        
        if (itens.length === 0) {
            mostrarListaVazia();
        } else {
            itens.forEach(item => adicionarItemNaLista(item));
        }
    }
    
    function filtrarItens() {
        const itens = obterItensStorage();
        listaCompras.innerHTML = '';
        
        const itensFiltrados = itens.filter(item => {
            if (currentFilter === 'all') return true;
            if (currentFilter === 'completed') return item.completado;
            if (currentFilter === 'pending') return !item.completado;
            return true;
        });
        
        if (itensFiltrados.length === 0) {
            mostrarListaVazia();
        } else {
            itensFiltrados.forEach(item => adicionarItemNaLista(item));
        }
    }
    
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
    
    function verificarListaVazia() {
        const itens = obterItensStorage();
        if (itens.length === 0) {
            mostrarListaVazia();
        }
    }
    
    function atualizarEstatisticas() {
        const itens = obterItensStorage();
        const total = itens.length;
        const completados = itens.filter(item => item.completado).length;
        
        totalItemsSpan.textContent = `${total} ${total === 1 ? 'item' : 'itens'}`;
        completedItemsSpan.textContent = `${completados} comprados`;
    }
    
    // Funções auxiliares
    function obterItensStorage() {
        return JSON.parse(localStorage.getItem('listaCompras')) || [];
    }
    
    function salvarItem(item) {
        let itens = obterItensStorage();
        itens.push(item);
        localStorage.setItem('listaCompras', JSON.stringify(itens));
    }
});