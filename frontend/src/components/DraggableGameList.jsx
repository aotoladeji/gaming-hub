import React, { useState } from 'react';

export default function DraggableGameList({ games, onReorder, onEdit, onToggle, onDelete }) {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [items, setItems] = useState(games);

  // Update items when games prop changes
  React.useEffect(() => {
    setItems(games);
  }, [games]);

  function handleDragStart(e, index) {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(e, dropIndex) {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newItems = [...items];
    const draggedItem = newItems[draggedIndex];
    
    // Remove from old position
    newItems.splice(draggedIndex, 1);
    // Insert at new position
    newItems.splice(dropIndex, 0, draggedItem);
    
    // Update display_order for all items
    const reorderedGames = newItems.map((item, idx) => ({
      id: item.id,
      display_order: idx
    }));
    
    setItems(newItems);
    setDraggedIndex(null);
    
    // Call the reorder callback
    onReorder(reorderedGames);
  }

  function handleDragEnd() {
    setDraggedIndex(null);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((game, index) => (
        <div
          key={game.id}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className="card"
          style={{
            padding: 16,
            cursor: 'grab',
            opacity: draggedIndex === index ? 0.5 : 1,
            transition: 'opacity 0.2s',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: draggedIndex === index ? 'var(--surface)' : 'var(--surface-raised)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 20, cursor: 'grab' }}>
              ⋮⋮
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{game.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {game.console_type} • {game.category || 'Uncategorized'} • ₦{Number(game.price_per_hour).toLocaleString()}/hr
              </div>
            </div>
            <span className={`badge ${game.status === 'available' ? 'badge-confirmed' : 'badge-cancelled'}`}>
              {game.status}
            </span>
          </div>
          
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn btn-outline btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(game);
              }}
            >
              Edit
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                onToggle(game);
              }}
            >
              Toggle
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(game.id);
              }}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
