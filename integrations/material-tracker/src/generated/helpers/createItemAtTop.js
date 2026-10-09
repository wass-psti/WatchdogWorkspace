import BoardSDK from '@material/api/BoardSDK.js';
const board = new BoardSDK();
export async function createItemAtTop({ name, group, ...fields }) {
  return board.item().create({ name, ...fields }).inGroup(group || 'new_group').execute();
}
