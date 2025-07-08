
'use client';

import React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { PlusCircle, Trash2, Undo, Pencil, Move, Copy, Folder, FileText, FileUp, FileClock } from 'lucide-react';

import type { ActionHistory } from '@/lib/data';
import { useAppContext } from '@/context/app-provider';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

const getActionIcon = (item: ActionHistory) => {
  const { action, entityType } = item;
  let icon: React.ReactNode;
  
  switch(action.type) {
    case 'CREATE':
      icon = <PlusCircle className="text-green-500" />;
      break;
    case 'RENAME':
      icon = <Pencil className="text-blue-500" />;
      break;
    case 'MOVE':
    case 'COPY':
      icon = <Move className="text-purple-500" />;
      break;
    case 'DELETE':
      icon = <Trash2 className="text-orange-500" />;
      break;
    case 'RESTORE':
      icon = <Undo className="text-green-500" />;
      break;
    case 'PERMANENT_DELETE':
      icon = <Trash2 className="text-destructive" />;
      break;
    case 'RETRIEVE':
        icon = <FileClock className="text-green-500" />;
        break;
    default:
      icon = entityType === 'folder' ? <Folder /> : <FileText />;
  }

  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
      {React.cloneElement(icon as React.ReactElement, { className: cn((icon as React.ReactElement).props.className, "size-4")})}
    </div>
  );
};

const formatDescription = (item: ActionHistory) => {
  const { entityType, entityName, action } = item;
  const target = <strong className="font-medium text-foreground">{entityName}</strong>;

  switch (action.type) {
    case 'CREATE':
      return <>Created {entityType} {target}{action.destination && action.destination !== 'Home' ? <> in <strong className="font-medium text-foreground">{action.destination}</strong></> : ''}.</>;
    case 'RENAME':
      return <>Renamed {entityType} from &quot;{action.from}&quot; to {target}.</>;
    case 'DELETE':
      return <>Moved {entityType} {target} to Trash.</>;
    case 'RESTORE':
      return <>Restored {entityType} {target}{action.from ? <> from <strong className="font-medium text-foreground">{action.from}</strong></> : ' from Trash'}.</>;
    case 'PERMANENT_DELETE':
      return <>Permanently deleted {entityType} {target}.</>;
    case 'MOVE':
      return <>Moved {entityType} {target} from <strong className="font-medium text-foreground">{action.from}</strong> to <strong className="font-medium text-foreground">{action.to}</strong>.</>;
    case 'COPY':
      return <>Copied {entityType} {target} to <strong className="font-medium text-foreground">{action.destination}</strong>.</>;
    case 'RETRIEVE':
        return <>Retrieved {entityType} {target} from history.</>;
    default:
      return 'An unknown action occurred.';
  }
};


export function HistoryList({ history }: { history: ActionHistory[] }) {
  const { getNoteById, folders, handleRetrieveItemFromHistory } = useAppContext();
  
  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {history.map((item, eventIdx) => {
          const isNote = item.entityType === 'note';
          const entity = isNote ? getNoteById(item.entityId ?? '') : folders.find(f => f.id === item.entityId);
          const linkHref = entity ? (isNote ? `/note/${entity.id}` : `/folder/${entity.id}`) : null;
          
          const Description = () => (
            <p className="text-sm text-muted-foreground">{formatDescription(item)}</p>
          );
          
          const canRetrieve = item.action.type === 'PERMANENT_DELETE' && !!item.entityData;


          return (
            <li key={item.id}>
              <div className="relative pb-8">
                {eventIdx !== history.length - 1 ? (
                  <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-border" aria-hidden="true" />
                ) : null}
                <div className="relative flex items-start space-x-3">
                  {getActionIcon(item)}
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        {linkHref ? (
                          <Link href={linkHref} className="hover:underline">
                            <Description />
                          </Link>
                        ) : (
                          <Description />
                        )}
                         <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                      {canRetrieve && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRetrieveItemFromHistory(item.id)}
                        >
                          <FileUp className="mr-2 size-4" />
                          Retrieve
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
