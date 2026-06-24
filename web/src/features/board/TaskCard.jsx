import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, MessageSquare, GripVertical, MoreHorizontal, Check } from 'lucide-react';
import { cn, taskCode } from '@/lib/utils';
import { Avatar } from '@/components/common/Avatar';
import { TypeTag, PriorityTag } from '@/components/common/badges';
import { TASK_STATUS, TASK_STATUS_ORDER } from '@/lib/constants';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

/** Carte de tâche (présentation). */
export function TaskCard({ task, onClick, dragging, grip = false, onQuickStatus, projectKey }) {
  const code = taskCode(task, projectKey);
  return (
    <div
      onClick={onClick}
      className={cn(
        'group rounded-xl border bg-white p-3 shadow-sm transition hover:shadow-md',
        onClick && 'cursor-pointer',
        dragging && 'opacity-50'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {code && <span className="font-mono text-[10px] font-medium text-slate-400">{code}</span>}
          <TypeTag type={task.type} />
        </div>
        <div className="flex items-center gap-1">
          <PriorityTag priority={task.priority} />
          {onQuickStatus && <QuickStatusMenu task={task} onQuickStatus={onQuickStatus} />}
          {grip && <GripVertical className="h-4 w-4 text-slate-300 opacity-0 transition group-hover:opacity-100" />}
        </div>
      </div>
      <p className="mt-2 text-sm font-medium leading-snug text-slate-800">{task.title}</p>
      {task.labels?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.labels.map((l) => (
            <span key={l} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
              {l}
            </span>
          ))}
        </div>
      )}
      <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {task.estimate || 0} h
        </span>
        {task.comments?.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            {task.comments.length}
          </span>
        )}
        {task.assignee && <span className="ml-auto"><Avatar name={task.assignee.name} id={task.assignee._id} size="xs" /></span>}
      </div>
    </div>
  );
}

/** Menu rapide pour changer le statut sans ouvrir le détail. */
function QuickStatusMenu({ task, onQuickStatus }) {
  const stop = (e) => e.stopPropagation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onPointerDown={stop}
          onClick={stop}
          className="rounded p-0.5 text-slate-300 opacity-0 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none group-hover:opacity-100 data-[state=open]:opacity-100"
          aria-label="Changer le statut"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={stop}>
        <DropdownMenuLabel>Déplacer vers</DropdownMenuLabel>
        {TASK_STATUS_ORDER.map((s) => (
          <DropdownMenuItem
            key={s}
            onClick={(e) => { stop(e); if (s !== task.status) onQuickStatus(task._id, s); }}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', TASK_STATUS[s].dot)} />
            {TASK_STATUS[s].label}
            {s === task.status && <Check className="ml-auto h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Carte triable (drag & drop) pour le Kanban.
 * Toute la carte est saisissable ; un clic simple (sans déplacement) ouvre le détail
 * grâce à la contrainte d'activation du PointerSensor (distance 5px).
 */
export function SortableTask({ task, onClick, disabled, onQuickStatus, projectKey }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task._id,
    disabled,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(disabled ? {} : listeners)}
      className={cn('touch-none', !disabled && 'cursor-grab active:cursor-grabbing')}
    >
      <TaskCard
        task={task}
        onClick={onClick}
        dragging={isDragging}
        grip={!disabled}
        onQuickStatus={disabled ? undefined : onQuickStatus}
        projectKey={projectKey}
      />
    </div>
  );
}
