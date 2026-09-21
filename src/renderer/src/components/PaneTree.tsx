import { Group, Panel, Separator } from 'react-resizable-panels'
import type { GroupNode, TreeNode } from '../paneTree'
import { TerminalPane } from './Terminal'

interface PaneTreeProps {
  root: TreeNode
  tabActive: boolean
  anyClosable: boolean
  cwd?: string
  profileId?: string
  onSplit: (paneId: string, direction: 'horizontal' | 'vertical') => void
  onClose: (paneId: string) => void
}

interface GroupViewProps extends Omit<PaneTreeProps, 'root'> {
  group: GroupNode
}

export function PaneTree({ root, tabActive, anyClosable, cwd, profileId, onSplit, onClose }: PaneTreeProps): JSX.Element {
  if (root.type === 'pane') {
    return (
      <TerminalPane
        key={root.id}
        id={root.id}
        active={tabActive}
        closable={anyClosable}
        terminalCwd={cwd}
        terminalProfile={profileId}
        onSplit={onSplit}
        onClose={onClose}
      />
    )
  }
  return <GroupView group={root} tabActive={tabActive} anyClosable={anyClosable} cwd={cwd} profileId={profileId} onSplit={onSplit} onClose={onClose} />
}

function GroupView({ group, tabActive, anyClosable, cwd, profileId, onSplit, onClose }: GroupViewProps): JSX.Element {
  const n = group.children.length
  return (
    <Group key={group.id} orientation={group.direction} id={group.id} className="pane-group">
      {group.children.flatMap((child, i) => {
        const panels: JSX.Element[] = [
          <Panel key={`${child.id}-panel`} id={`${child.id}-panel`} minSize={12} className="pane-panel">
            {child.type === 'pane' ? (
              <TerminalPane
                key={child.id}
                id={child.id}
                active={tabActive}
                closable={anyClosable}
                terminalCwd={cwd}
                terminalProfile={profileId}
                onSplit={onSplit}
                onClose={onClose}
              />
            ) : (
              <GroupView key={child.id} group={child} tabActive={tabActive} anyClosable={anyClosable} cwd={cwd} profileId={profileId} onSplit={onSplit} onClose={onClose} />
            )}
          </Panel>
        ]
        if (i < n - 1) {
          const handleClass = group.direction === 'horizontal' ? 'pane-resize-handle--col' : 'pane-resize-handle--row'
          panels.push(
            <Separator
              key={`${child.id}-sep`}
              id={`${child.id}-sep`}
              className={`pane-resize-handle ${handleClass}`}
            />
          )
        }
        return panels
      })}
    </Group>
  )
}