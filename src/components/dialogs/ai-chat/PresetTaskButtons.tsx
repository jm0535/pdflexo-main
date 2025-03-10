
import React from 'react';
import { Button } from '@/components/ui/button';

interface PresetTaskButtonsProps {
  tasks: string[];
  onSelectTask: (task: string) => void;
}

const PresetTaskButtons: React.FC<PresetTaskButtonsProps> = ({ tasks, onSelectTask }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {tasks.map((task) => (
        <Button 
          key={task} 
          variant="outline" 
          size="sm" 
          onClick={() => onSelectTask(task)}
          className="text-xs"
        >
          {task}
        </Button>
      ))}
    </div>
  );
};

export default PresetTaskButtons;
