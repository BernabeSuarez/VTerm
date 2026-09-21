export type PaneNode = { type: 'pane'; id: string }
export type GroupNode = { type: 'group'; id: string; direction: 'horizontal' | 'vertical'; children: TreeNode[] }
export type TreeNode = PaneNode | GroupNode

let counter = 0

export function createPaneId(): string {
  counter += 1
  return `term-${Date.now()}-${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

function createGroupId(): string {
  counter += 1
  return `grp-${Date.now()}-${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export function createRootPane(): TreeNode {
  return { type: 'pane', id: createPaneId() }
}

export function splitNode(node: TreeNode, paneId: string, direction: GroupNode['direction']): TreeNode {
  if (node.type === 'pane') {
    if (node.id !== paneId) return node
    const newPane = createPaneNode()
    return { type: 'group', id: createGroupId(), direction, children: [node, newPane] }
  }
  let changed = false
  const children = node.children.map((child) => {
    const next = splitNode(child, paneId, direction)
    if (next !== child) changed = true
    return next
  })
  return changed ? { ...node, children } : node
}

export function removePane(node: TreeNode, paneId: string): TreeNode | null {
  if (node.type === 'pane') return node.id === paneId ? null : node
  const children = node.children.map((child) => removePane(child, paneId)).filter((c): c is TreeNode => c !== null)
  if (children.length === 0) return null
  if (children.length === 1) return children[0]
  return { ...node, children }
}

export function collectPaneIds(node: TreeNode): string[] {
  if (node.type === 'pane') return [node.id]
  return node.children.flatMap(collectPaneIds)
}

export function countPanes(node: TreeNode): number {
  return collectPaneIds(node).length
}

function createPaneNode(): PaneNode {
  return { type: 'pane', id: createPaneId() }
}