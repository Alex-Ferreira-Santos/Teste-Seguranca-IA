import { AppDataSource } from './config/database';
import { Role } from './entities/Role';
import { DefaultRoles } from './config/permissions';

export async function seedDatabase() {
  const roleRepository = AppDataSource.getRepository(Role);
  
  for (const roleConfig of Object.values(DefaultRoles)) {
    const existingRole = await roleRepository.findOne({
      where: { name: roleConfig.name },
    });
    
    if (!existingRole) {
      const role = new Role();
      role.name = roleConfig.name;
      role.permissions = roleConfig.permissions;
      role.level = roleConfig.level;
      role.createdBy = 'system';
      
      await roleRepository.save(role);
      console.log(`Created role: ${roleConfig.name}`);
    }
  }
  
  console.log('Database seeded successfully');
}