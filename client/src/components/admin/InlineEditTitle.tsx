import React, { useState } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface InlineEditTitleProps {
  title: string;
  onSave: (newTitle: string) => Promise<void>;
  placeholder?: string;
  className?: string;
}

export function InlineEditTitle({ title, onSave, placeholder = "Enter title...", className = "" }: InlineEditTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditValue(title);
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!editValue.trim() || editValue === title) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    
    try {
      await onSave(editValue.trim());
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Title updated successfully",
        variant: "default",
      });
    } catch (error) {
      console.error('Error updating title:', error);
      toast({
        title: "Error",
        description: "Failed to update title. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    setEditValue(title);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave(e as any);
    } else if (e.key === 'Escape') {
      handleCancel(e as any);
    }
  };

  if (isEditing) {
    return (
      <div className={`flex items-center gap-2 ${className}`} onClick={(e) => e.stopPropagation()}>
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 h-8 text-sm"
          autoFocus
          disabled={isLoading}
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          disabled={isLoading}
          className="h-8 w-8 p-0 hover:bg-green-50"
        >
          <Check className="h-4 w-4 text-green-600" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          disabled={isLoading}
          className="h-8 w-8 p-0 hover:bg-red-50"
        >
          <X className="h-4 w-4 text-red-600" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`group flex items-center gap-2 ${className}`}>
      <span className="flex-1">{title}</span>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleEdit}
        className="h-6 w-6 p-0 opacity-80 hover:opacity-100 transition-opacity hover:bg-gray-100"
      >
        <Edit2 className="h-3 w-3 text-gray-600" />
      </Button>
    </div>
  );
}