type IndexSpec = {
    path: string;
    type: string;
};

const soupName: string = 'Users';

 const indexSpecs: IndexSpec[] = [
    { path: 'name', type: 'string' },
    { path: 'dob', type: 'string' },
    { path: 'gender', type: 'string' },
    { path: 'maritalStatus', type: 'string' },
    { path: 'experience', type: 'string' },
    { path: 'mobile', type: 'string' }
];

export{soupName, indexSpecs};