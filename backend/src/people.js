import { prisma } from '../prisma/client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const people = await prisma.people.findMany({
        orderBy: { dateRegistered: 'desc' }
      });
      return res.status(200).json(people);
    }

    if (req.method === 'POST') {
      const data = req.body;
      
      const person = await prisma.people.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          rucCi: data.rucCi,
          birthDate: data.birthDate,
          mainEmail: data.mainEmail,
          phone: data.phone,
          address: data.address,
          personType: data.personType,
          identityType: data.identityType
        }
      });
      
      return res.status(201).json(person);
    }

    return res.status(405).json({ error: 'Método no permitido' });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}