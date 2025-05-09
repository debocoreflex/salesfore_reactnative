import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const mySchema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'Users',
      columns: [
        { name: 'mobile', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'dob', type: 'string' },
        { name: 'marital_status', type: 'string' },
        { name: 'experience', type: 'string' },
        { name: 'gender', type: 'string' },
      ],
    }),
  ],
});
