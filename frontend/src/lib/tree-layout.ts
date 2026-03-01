export type TreeNode = {
    handle: string;
    displayName: string;
    gender: number;
    generation: number;
    isLiving: boolean;
    isPrivacyFiltered: boolean;
    isPatrilineal: boolean;
    families: string[];
    parentFamilies: string[];
    birthYear?: number;
    deathYear?: number;
};

export type TreeFamily = {
    handle: string;
    fatherHandle?: string;
    motherHandle?: string;
    children: string[];
};

export type PositionedNode = TreeNode & { node: TreeNode; x: number; y: number };
export type PositionedCouple = {
    id: string;
    familyHandle: string;
    fatherPos?: PositionedNode;
    motherPos?: PositionedNode;
    midX: number;
    y: number;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
};
export type Connection = { fromX: number; fromY: number; toX: number; toY: number; type: 'parent' | 'couple' };

export type LayoutResult = {
    nodes: PositionedNode[];
    connections: Connection[];
    couples: PositionedCouple[];
    width: number;
    height: number;
};

export const CARD_W = 180;
export const CARD_H = 96;

export function computeLayout(people: TreeNode[], families: TreeFamily[]): LayoutResult {
    const H_GAP = 56;
    const V_GAP = 140;
    const SPOUSE_GAP = 28;

    const peopleByHandle = new Map(people.map(p => [p.handle, p]));
    const personOrder = new Map<string, { familyIndex: number; childIndex: number }>();
    families.forEach((f, i) => {
        if (f.fatherHandle && peopleByHandle.has(f.fatherHandle)) {
            const prev = personOrder.get(f.fatherHandle);
            if (!prev || i < prev.familyIndex) personOrder.set(f.fatherHandle, { familyIndex: i, childIndex: -1 });
        }
        if (f.motherHandle && peopleByHandle.has(f.motherHandle)) {
            const prev = personOrder.get(f.motherHandle);
            if (!prev || i < prev.familyIndex) personOrder.set(f.motherHandle, { familyIndex: i, childIndex: -1 });
        }
        f.children.forEach((ch, idx) => {
            if (!peopleByHandle.has(ch)) return;
            const prev = personOrder.get(ch);
            if (!prev || i < prev.familyIndex || (i === prev.familyIndex && idx < prev.childIndex)) {
                personOrder.set(ch, { familyIndex: i, childIndex: idx });
            }
        });
    });

    type Group = { id: string; members: TreeNode[]; generation: number; order: { familyIndex: number; childIndex: number; name: string } };
    const groups: Group[] = [];
    const assigned = new Set<string>();

    families.forEach((f, i) => {
        const father = f.fatherHandle ? peopleByHandle.get(f.fatherHandle) : undefined;
        const mother = f.motherHandle ? peopleByHandle.get(f.motherHandle) : undefined;
        if (father && mother && !assigned.has(father.handle) && !assigned.has(mother.handle)) {
            if (father.generation === mother.generation) {
                assigned.add(father.handle);
                assigned.add(mother.handle);
                const order = { familyIndex: i, childIndex: -1, name: `${father.displayName}-${mother.displayName}` };
                groups.push({ id: `family:${f.handle}`, members: [mother, father], generation: father.generation, order });
            }
        }
    });

    for (const p of people) {
        if (assigned.has(p.handle)) continue;
        const orderMeta = personOrder.get(p.handle) ?? { familyIndex: Number.MAX_SAFE_INTEGER, childIndex: Number.MAX_SAFE_INTEGER };
        groups.push({
            id: `person:${p.handle}`,
            members: [p],
            generation: p.generation,
            order: { ...orderMeta, name: p.displayName },
        });
    }

    const groupsByGen = new Map<number, Group[]>();
    for (const g of groups) {
        if (!groupsByGen.has(g.generation)) groupsByGen.set(g.generation, []);
        groupsByGen.get(g.generation)!.push(g);
    }

    const sortedGens = Array.from(groupsByGen.keys()).sort((a, b) => a - b);
    const nodes: PositionedNode[] = [];
    let maxX = 0;
    let maxY = 0;

    for (const gen of sortedGens) {
        const rowGroups = groupsByGen.get(gen)!;
        rowGroups.sort((a, b) => {
            if (a.order.familyIndex !== b.order.familyIndex) return a.order.familyIndex - b.order.familyIndex;
            if (a.order.childIndex !== b.order.childIndex) return a.order.childIndex - b.order.childIndex;
            return a.order.name.localeCompare(b.order.name);
        });
        let xCursor = 0;
        for (const g of rowGroups) {
            const y = gen * (CARD_H + V_GAP);
            const members = g.members.slice().sort((m1, m2) => (m2.gender ?? 0) - (m1.gender ?? 0));
            members.forEach((p, idx) => {
                const x = xCursor + idx * (CARD_W + SPOUSE_GAP);
                nodes.push({ ...p, node: p, x, y });
                maxX = Math.max(maxX, x + CARD_W);
                maxY = Math.max(maxY, y + CARD_H);
            });
            const groupWidth = members.length * CARD_W + (members.length - 1) * SPOUSE_GAP;
            xCursor += groupWidth + H_GAP;
        }
    }

    const nodeMap = new Map(nodes.map(n => [n.handle, n]));
    const connections: Connection[] = [];
    const couples: PositionedCouple[] = [];

    const centerX = (n: PositionedNode) => n.x + CARD_W / 2;
    const centerY = (n: PositionedNode) => n.y + CARD_H / 2;

    for (const f of families) {
        const fatherPos = f.fatherHandle ? nodeMap.get(f.fatherHandle) : undefined;
        const motherPos = f.motherHandle ? nodeMap.get(f.motherHandle) : undefined;
        let parentCenterX: number | null = null;
        let parentBottomY: number | null = null;
        if (fatherPos && motherPos) {
            const fx = centerX(fatherPos);
            const fy = centerY(fatherPos);
            const mx = centerX(motherPos);
            const my = centerY(motherPos);
            connections.push({ fromX: fx, fromY: fy, toX: mx, toY: my, type: 'couple' });
            const midX = (fx + mx) / 2;
            const y = Math.min(fatherPos.y, motherPos.y);
            couples.push({
                id: f.handle,
                familyHandle: f.handle,
                fatherPos,
                motherPos,
                midX,
                y,
                fromX: fx,
                fromY: fy,
                toX: mx,
                toY: my,
            });
            parentCenterX = midX;
            parentBottomY = Math.max(fatherPos.y, motherPos.y) + CARD_H;
        } else if (fatherPos || motherPos) {
            const p = fatherPos ?? motherPos!;
            parentCenterX = centerX(p);
            parentBottomY = p.y + CARD_H;
        }

        if (parentCenterX !== null && parentBottomY !== null) {
            for (const ch of f.children) {
                const childPos = nodeMap.get(ch);
                if (!childPos) continue;
                const childCenterX = centerX(childPos);
                const childTopY = childPos.y;
                const midY = (parentBottomY + childTopY) / 2;
                connections.push({ fromX: parentCenterX, fromY: parentBottomY, toX: parentCenterX, toY: midY, type: 'parent' });
                connections.push({ fromX: parentCenterX, fromY: midY, toX: childCenterX, toY: midY, type: 'parent' });
                connections.push({ fromX: childCenterX, fromY: midY, toX: childCenterX, toY: childTopY, type: 'parent' });
            }
        }
    }
    return {
        nodes,
        connections,
        couples,
        width: nodes.length ? maxX : 0,
        height: nodes.length ? maxY : 0,
    };
}

export function filterAncestors(handle: string, people: TreeNode[], families: TreeFamily[]) {
    return { people, families, focusHandle: handle };
}

export function filterDescendants(handle: string, people: TreeNode[], families: TreeFamily[]) {
    return { people, families, focusHandle: handle };
}
