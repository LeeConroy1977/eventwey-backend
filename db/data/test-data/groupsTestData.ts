export const groupData: any[] = [
  {
    id: 1,
    name: 'Tech Enthusiasts',
    image:
      'https://promptzone-community.s3.amazonaws.com/uploads/articles/05jtetckc5asjbeto03g.jpeg',
    description: [
      'A group for tech enthusiasts, from coders to hardware lovers.',
      "Join a vibrant community where we explore the latest tech trends, share coding tips, and build innovative projects. Whether you're a seasoned developer or just starting out, you'll find like-minded individuals here.",
      "The group hosts weekly discussions about emerging technologies, coding best practices, and hardware projects. It's a great place for collaboration and networking.",
      'We also organize events like hackathons and coding challenges to help members improve their skills and learn new technologies in a fun, competitive environment.',
    ],
    openAccess: true,
    location: {
      placename: 'Weymouth Library',
      lng: -2.4512,
      lat: 50.6105,
    },
    category: 'technology',
    approved: true,
    events: [1],
    creationDate: new Date().toISOString(),
    groupAdmins: [
      {
        id: 1,
        username: 'Lily Smith',
        email: 'lily1@gmail.com',
        password:
          '$2b$10$g19j8pb8crfGjayynOBK3erwVz9UQGhI6pvnvBj7NQYmG3K.qtJzu',
        googleId: null,
        authMethod: 'email',
        profileBackgroundImage: 'https://picsum.photos/800/600?random=1',
        profileImage: 'https://randomuser.me/api/portraits/women/68.jpg',
        aboutMe:
          'Hi, I’m Lily! I’m passionate about connecting with people and exploring new experiences. Whether it’s attending community events, learning a new skill, or just enjoying a fun day out, I love being part of activities that bring people together. My interests include tech, sustainability, and trying out unique workshops.',
        bio: 'Avid traveler, foodie and animal lover',
        tags: ['Gourmet Food Tours', 'Animal Rescue', 'Wanderlust Adventures'],
        viewEventsStatus: 'public',
        viewConnectionsStatus: 'public',
        viewGroupsStatus: 'public',
        viewTagsStatus: 'public',
        viewProfileImage: 'public',
        viewBioStatus: 'public',
        aboutMeStatus: 'public',
        role: 'user',
      },
    ],
    members: [],
  },
  {
    id: 2,
    name: 'Weymouth Foodies',
    image:
      'https://media.licdn.com/dms/image/v2/D4D1BAQFIoyCGzrvycQ/company-background_10000/company-background_10000/0/1656924614519/foodies_media_cover?e=2147483647&v=beta&t=c-o9v8vkj92jYW7-KI7os-xU7vvZKrDL1jIBcewxQTk',
    description: [
      'A group for food lovers and amateur chefs.',
      'If you have a passion for cooking or just love trying new recipes, this is the place for you. Our members share their culinary experiments, kitchen tips, and favorite recipes.',
      'We host monthly cooking challenges where members can submit their own recipes or try new ones together. These challenges are fun and a great way to expand your culinary skills.',
      'Members also meet up to enjoy food tasting events and collaborate on meal prep, making it easy to share the joy of cooking with others.',
    ],
    openAccess: false,
    location: {
      placename: 'Weymouth Library',
      lng: -2.4512,
      lat: 50.6105,
    },
    category: 'food & drink',
    approved: true,
    events: [2, 4],
    creationDate: new Date().toISOString(),
    groupAdmins: [
      {
        tags: ['Tech Meetups', 'Creative Writing', 'Sci-Fi Screenings'],
        id: 2,
        email: 'hannibal2@gmail.com',
        username: 'Hannible Decker',
        password:
          '$2b$10$z2YzYW01by5iEUh4YSZtduqkset5Bo/ND6a7QUGpRzyibV5WB6ZXO',
        googleId: null,
        authMethod: 'email',
        profileBackgroundImage: 'https://picsum.photos/800/600?random=2',
        profileImage: 'https://randomuser.me/api/portraits/men/2.jpg',
        aboutMe:
          'Hi, I’m John! I’m passionate about connecting with people and exploring new experiences. Whether it’s attending community events, learning a new skill, or just enjoying a fun day out, I love being part of activities that bring people together. My interests include tech, sustainability, and trying out unique workshops.',
        bio: 'Lover of all things tech, startup enthusiast',
        viewEventsStatus: 'public',
        viewConnectionsStatus: 'public',
        viewGroupsStatus: 'public',
        viewTagsStatus: 'public',
        viewProfileImage: 'public',
        viewBioStatus: 'public',
        aboutMeStatus: 'public',
        role: 'user',
      },
    ],
    members: [],
  },

  {
    id: 3,
    name: 'Weymouth Adventure Group',
    image:
      'https://premiumteamnames.com/wp-content/uploads/2024/11/Adventure-Group-Names.webp',
    description: [
      'Discover the thrill of outdoor adventures around Weymouth!',
      'Weymouth Adventure Group is for individuals passionate about exploring nature, embracing physical challenges, and connecting with fellow adventurers. Whether you’re into hiking, kayaking, climbing, or just trying new outdoor activities, this group has something for everyone.',
      'We organize a variety of activities, including coastal hikes, paddleboarding sessions, and group excursions to nearby adventure parks. Members also share tips on the best local spots for exploration and plan spontaneous outings.',
      'Join us to step outside your comfort zone, build new skills, and create unforgettable memories with a community that loves the great outdoors!',
    ],
    openAccess: false,
    location: {
      placename: 'Weymouth Library',
      lng: -2.4512,
      lat: 50.6105,
    },
    category: 'outdoors',
    approved: true,
    events: [3],
    creationDate: new Date().toISOString(),
    groupAdmins: [
      {
        id: 1,
        username: 'Lily Smith',
        email: 'lily1@gmail.com',
        password:
          '$2b$10$g19j8pb8crfGjayynOBK3erwVz9UQGhI6pvnvBj7NQYmG3K.qtJzu',
        googleId: null,
        authMethod: 'email',
        profileBackgroundImage: 'https://picsum.photos/800/600?random=1',
        profileImage: 'https://randomuser.me/api/portraits/women/68.jpg',
        aboutMe:
          'Hi, I’m Lily! I’m passionate about connecting with people and exploring new experiences. Whether it’s attending community events, learning a new skill, or just enjoying a fun day out, I love being part of activities that bring people together. My interests include tech, sustainability, and trying out unique workshops.',
        bio: 'Avid traveler, foodie and animal lover',
        tags: ['Gourmet Food Tours', 'Animal Rescue', 'Wanderlust Adventures'],
        viewEventsStatus: 'public',
        viewConnectionsStatus: 'public',
        viewGroupsStatus: 'public',
        viewTagsStatus: 'public',
        viewProfileImage: 'public',
        viewBioStatus: 'public',
        aboutMeStatus: 'public',
        role: 'user',
      },
    ],
    members: [],
  },
];
