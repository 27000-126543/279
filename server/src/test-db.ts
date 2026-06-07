import { initDatabase } from './db';
import { userDAO } from './db/dao';

console.log('测试数据库...');
initDatabase();

console.log('测试创建用户...');
try {
  const user = userDAO.create('test_user');
  console.log('用户创建成功:', user);
  
  const fetched = userDAO.getById(user.id);
  console.log('查询到的用户:', fetched);
} catch (error: any) {
  console.error('错误:', error.message);
  console.error(error.stack);
}
