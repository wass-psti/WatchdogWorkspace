import { apiFetch } from './http';

class ItemsQuery {
  constructor() { this.filters = {}; this.sort = null; this.page = {}; this.columns = []; }
  withColumns(cols) { this.columns = cols || []; return this; }
  where(filters = {}) { this.filters = filters; return this; }
  orderBy(sort) { this.sort = sort; return this; }
  withPagination(page = {}) { this.page = page; return this; }
  async execute() {
    const qs = new URLSearchParams();
    if (Object.keys(this.filters).length) qs.set('where', JSON.stringify(this.filters));
    if (this.sort) qs.set('sort', JSON.stringify(this.sort));
    if (this.page.limit) qs.set('limit', String(this.page.limit));
    if (this.page.cursor) qs.set('cursor', String(this.page.cursor));
    return apiFetch(`/api/items?${qs.toString()}`);
  }
}

class ItemUpdateQuery {
  constructor(id, updates = {}) { this.id = id; this.updates = updates || {}; this.groupId = null; }
  inGroup(groupId) { this.groupId = groupId; return this; }
  async execute() { return apiFetch(`/api/items/${this.id}`, { method: 'PATCH', body: JSON.stringify({ updates: this.updates, groupId: this.groupId }) }); }
}

class ItemCreateQuery {
  constructor(fields) { this.fields = fields || {}; this.groupId = 'new_group'; }
  inGroup(groupId) { this.groupId = groupId || 'new_group'; return this; }
  returnColumns() { return this; }
  async execute() { return apiFetch('/api/items', { method: 'POST', body: JSON.stringify({ ...this.fields, groupId: this.groupId }) }); }
}

class SubitemMutation {
  constructor(itemId, subitemId, mode, fields) { this.itemId = itemId; this.subitemId = subitemId; this.mode = mode; this.fields = fields || {}; }
  returnColumns() { return this; }
  async execute() {
    if (this.mode === 'create') return apiFetch(`/api/items/${this.itemId}/subitems`, { method: 'POST', body: JSON.stringify(this.fields) });
    return apiFetch(`/api/items/${this.itemId}/subitems/${this.subitemId}`, { method: 'PATCH', body: JSON.stringify(this.fields) });
  }
}
class SubitemQuery {
  constructor(itemId, subitemId = null) { this.itemId = itemId; this.subitemId = subitemId; }
  create(fields) { return new SubitemMutation(this.itemId, null, 'create', fields); }
  update(fields) { return new SubitemMutation(this.itemId, this.subitemId, 'update', fields); }
}

class NotificationQuery {
  constructor(itemId, userId) { this.itemId = itemId; this.userId = userId; }
  create(message) { this.message = message; return this; }
  async execute() { return apiFetch('/api/notifications', { method: 'POST', body: JSON.stringify({ itemId: this.itemId, userId: this.userId, message: this.message }) }); }
}

class ItemQuery {
  constructor(id) { this.id = id; this.mode = 'item'; }
  create(fields) { return new ItemCreateQuery(fields); }
  update(fields = {}) { return new ItemUpdateQuery(this.id, fields); }
  archive() { this.mode = 'archive'; return this; }
  withUpdates() { this.mode = 'updates'; return this; }
  withSubItems() { this.mode = 'subitems'; return this; }
  subitem(subitemId = null) { return new SubitemQuery(this.id, subitemId); }
  notify(userId) { return new NotificationQuery(this.id, userId); }
  async execute() {
    if (this.mode === 'archive') return apiFetch(`/api/items/${this.id}`, { method: 'DELETE' });
    if (this.mode === 'updates') return apiFetch(`/api/items/${this.id}/updates`);
    if (this.mode === 'subitems') return apiFetch(`/api/items/${this.id}/subitems`);
    return apiFetch(`/api/items/${this.id}`);
  }
}

class AggregateQuery {
  constructor() { this.groupColumn = null; this.metrics = []; }
  groupBy(column) { this.groupColumn = column; return this; }
  countItems(alias = 'count') { this.metrics.push({ op: 'count', alias }); return this; }
  sum(column, alias) { this.metrics.push({ op: 'sum', column, alias }); return this; }
  avg(column, alias) { this.metrics.push({ op: 'avg', column, alias }); return this; }
  async execute() {
    const qs = new URLSearchParams();
    if (this.groupColumn) qs.set('groupBy', this.groupColumn);
    qs.set('metrics', JSON.stringify(this.metrics));
    return apiFetch(`/api/aggregates?${qs.toString()}`);
  }
}

export default class BoardSDK {
  items() { return new ItemsQuery(); }
  item(id = null) { return new ItemQuery(id); }
  aggregate() { return new AggregateQuery(); }
  users = {
    me: () => ({ execute: () => apiFetch('/api/users/me') }),
    boardSubscribers: () => ({ execute: () => apiFetch('/api/users') }),
  };
  async executeGraphQL() { throw new Error('GraphQL is not used in the standalone local build.'); }
}
