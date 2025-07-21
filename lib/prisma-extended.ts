import { PrismaClient } from '@prisma/client';

/**
 * Extended Prisma client with custom array field operations
 * Provides utility methods for manipulating array fields in PostgreSQL
 * Similar to SQLAlchemy Core array operations but for Prisma ORM
 */
export const prisma = new PrismaClient().$extends({
  model: {
    todo: {
      /**
       * Removes a specific value from an array field across multiple records
       * Useful for cleaning up references when deleting related entities
       * 
       * @param field - The array field name to modify (e.g., 'dependencies')
       * @param valueToRemove - The value to remove from the array
       * @param whereCondition - Condition to select which records to update
       * @returns Promise resolving to array of updated records
       */
      async removeFromArrayField<T extends keyof Pick<{
        dependencies: number[];
      }, 'dependencies'>>(
        field: T,
        valueToRemove: number,
        whereCondition: { id: { in: number[] } }
      ) {
        // First, fetch current records with their array values
        const records = await prisma.todo.findMany({
          where: whereCondition,
          select: { id: true, [field]: true }
        });

        // Build individual update operations for each record
        const updates = records.map(record => 
          prisma.todo.update({
            where: { id: record.id },
            data: {
              [field]: (record[field] as number[]).filter(val => val !== valueToRemove)
            }
          })
        );

        // Execute all updates in parallel
        return Promise.all(updates);
      },

      /**
       * Adds a value to an array field across multiple records
       * Prevents duplicates by checking if value already exists
       * 
       * @param field - The array field name to modify
       * @param valueToAdd - The value to add to the array
       * @param whereCondition - Condition to select which records to update
       * @returns Promise resolving to array of updated records
       */
      async addToArrayField<T extends keyof Pick<{
        dependencies: number[];
      }, 'dependencies'>>(
        field: T,
        valueToAdd: number,
        whereCondition: { id: { in: number[] } }
      ) {
        // Fetch current records to check existing values
        const records = await prisma.todo.findMany({
          where: whereCondition,
          select: { id: true, [field]: true }
        });

        // Build updates, avoiding duplicates
        const updates = records.map(record => {
          const currentArray = record[field] as number[];
          const newArray = currentArray.includes(valueToAdd) 
            ? currentArray 
            : [...currentArray, valueToAdd];
          
          return prisma.todo.update({
            where: { id: record.id },
            data: { [field]: newArray }
          });
        });

        return Promise.all(updates);
      },

      /**
       * Performs conditional batch updates on array fields
       * Allows complex conditional logic for array transformations
       * 
       * @param updates - Array of update specifications with conditions and transformations
       * @returns Promise resolving to array of successfully updated records
       */
      async conditionalArrayUpdate(
        updates: Array<{
          id: number;
          condition: (currentDependencies: number[]) => boolean;
          transform: (currentDependencies: number[]) => number[];
        }>
      ) {
        const ids = updates.map(u => u.id);
        
        // Fetch all records that might be updated
        const records = await prisma.todo.findMany({
          where: { id: { in: ids } },
          select: { id: true, dependencies: true }
        });

        // Build conditional updates
        const updatePromises = records.map(record => {
          const updateSpec = updates.find(u => u.id === record.id);
          if (!updateSpec) return Promise.resolve(null);

          // Only update if condition is met
          if (updateSpec.condition(record.dependencies)) {
            return prisma.todo.update({
              where: { id: record.id },
              data: {
                dependencies: updateSpec.transform(record.dependencies)
              }
            });
          }
          return Promise.resolve(null);
        });

        const results = await Promise.all(updatePromises);
        return results.filter(result => result !== null);
      }
    }
  }
});

export default prisma; 