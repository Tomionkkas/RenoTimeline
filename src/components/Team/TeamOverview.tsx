
import React from 'react';
import { Users, UserPlus, Mail, Phone } from 'lucide-react';

const teamMembers = [
  {
    id: 1,
    name: 'Anna Nowak',
    role: 'Frontend Developer',
    email: 'anna@example.com',
    phone: '+48 123 456 789',
    avatar: 'AN',
    status: 'online',
    tasksCompleted: 24,
    tasksInProgress: 3,
  },
  {
    id: 2,
    name: 'Piotr Kowalski',
    role: 'Backend Developer',
    email: 'piotr@example.com',
    phone: '+48 987 654 321',
    avatar: 'PK',
    status: 'away',
    tasksCompleted: 18,
    tasksInProgress: 2,
  },
  {
    id: 3,
    name: 'Maria Wiśniewska',
    role: 'UX/UI Designer',
    email: 'maria@example.com',
    phone: '+48 555 444 333',
    avatar: 'MW',
    status: 'online',
    tasksCompleted: 31,
    tasksInProgress: 1,
  },
  {
    id: 4,
    name: 'Tomasz Nowicki',
    role: 'DevOps Engineer',
    email: 'tomasz@example.com',
    phone: '+48 222 111 000',
    avatar: 'TN',
    status: 'offline',
    tasksCompleted: 15,
    tasksInProgress: 4,
  },
];

const statusColors = {
  online: 'bg-green-400',
  away: 'bg-yellow-400',
  offline: 'bg-gray-400',
};

const TeamOverview = () => {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Zespół</h1>
          <p className="text-gray-400">Zarządzaj członkami zespołu</p>
        </div>
        <button className="btn-primary flex items-center space-x-2">
          <UserPlus className="w-4 h-4" />
          <span>Dodaj członka</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {teamMembers.map((member, index) => (
          <div
            key={member.id}
            className="bg-card rounded-xl border border-gray-800 p-6 card-hover animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-accent rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">{member.avatar}</span>
                </div>
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${statusColors[member.status as keyof typeof statusColors]} rounded-full border-2 border-gray-800`}></div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">{member.name}</h3>
                <p className="text-blue-400 text-sm mb-3">{member.role}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 text-gray-400 text-sm">
                    <Mail className="w-4 h-4" />
                    <span>{member.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-400 text-sm">
                    <Phone className="w-4 h-4" />
                    <span>{member.phone}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-800 rounded-lg">
                    <p className="text-green-400 font-semibold">{member.tasksCompleted}</p>
                    <p className="text-gray-400 text-xs">Ukończone</p>
                  </div>
                  <div className="text-center p-3 bg-gray-800 rounded-lg">
                    <p className="text-blue-400 font-semibold">{member.tasksInProgress}</p>
                    <p className="text-gray-400 text-xs">W toku</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamOverview;
