import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button";

import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
interface DataSheetItem {
  tipo: string;
  valor: string;
}

interface DataSheetProps {
  setItems: (items: DataSheetItem[]) => void;
  itemsdataShet?: DataSheetItem[];
}

function DataSheet({ setItems, itemsdataShet = [] }: DataSheetProps) {
  const [localItems, setLocalItems] = useState<DataSheetItem[]>(itemsdataShet);
  const [nuevoTipo, setNuevoTipo] = useState('');
  const [nuevoValor, setNuevoValor] = useState('');

  useEffect(() => {
    setLocalItems(itemsdataShet);
  }, [itemsdataShet]);

  useEffect(() => {
    setItems(localItems);
  }, [localItems, setItems]);

  const agregarItem = () => {
    if (nuevoTipo.trim() && nuevoValor.trim()) {
      const nuevoItem = { 
        tipo: nuevoTipo.trim().toUpperCase(), 
        valor: nuevoValor.trim().toUpperCase() 
      };
      
      const nuevosItems = [...localItems, nuevoItem];
      setLocalItems(nuevosItems);
      setNuevoTipo('');
      setNuevoValor('');
    }
  };

  const eliminarItem = (index: number) => {
    const nuevosItems = localItems.filter((_, i) => i !== index);
    setLocalItems(nuevosItems);
  };

  const actualizarItem = (index: number, campo: keyof DataSheetItem, valor: string) => {
    const nuevosItems = localItems.map((item, i) => 
      i === index ? { ...item, [campo]: valor.trim().toUpperCase() } : item
    );
    setLocalItems(nuevosItems);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      agregarItem();
    }
  };

  const limpiarTodo = () => {
    setLocalItems([]);
    setNuevoTipo('');
    setNuevoValor('');
  };

  return (
    <div className="grid gap-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Especificaciones Técnicas</h3>
        {localItems.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={limpiarTodo}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Limpiar Todo
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo *</Label>
          <Input
            id="tipo"
            placeholder="Ej: MARCA, MODELO, COLOR"
            value={nuevoTipo}
            onChange={(e) => setNuevoTipo(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="valor">Valor *</Label>
          <Input
            id="valor"
            placeholder="Ej: SIEMENS, X1000, ROJO"
            value={nuevoValor}
            onChange={(e) => setNuevoValor(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </div>
        
        <Button 
          onClick={agregarItem}
          disabled={!nuevoTipo.trim() || !nuevoValor.trim()}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Agregar
        </Button>
      </div>

      <div className="space-y-2">
        {localItems.map((item, index) => (
          <div key={index} className="flex items-center gap-3 p-3 border rounded bg-gray-50">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor={`tipo-${index}`} className="text-xs text-gray-600">
                  Tipo
                </Label>
                <Input
                  id={`tipo-${index}`}
                  value={item.tipo}
                  onChange={(e) => actualizarItem(index, 'tipo', e.target.value)}
                  placeholder="Tipo"
                  className="bg-white"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`valor-${index}`} className="text-xs text-gray-600">
                  Valor
                </Label>
                <Input
                  id={`valor-${index}`}
                  value={item.valor}
                  onChange={(e) => actualizarItem(index, 'valor', e.target.value)}
                  placeholder="Valor"
                  className="bg-white"
                />
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => eliminarItem(index)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        
        {localItems.length === 0 && (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <Plus className="h-8 w-8 text-gray-400" />
              <p>No hay especificaciones técnicas agregadas</p>
              <p className="text-sm">Agregue tipos y valores para crear la hoja de datos</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

export default DataSheet