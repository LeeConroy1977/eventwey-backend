import { Comment } from './src/entities/comment.entity';
import { Connection } from './src/entities/connection.entity';
import { AppEvent } from './src/entities/event.entity';
import { Group } from './src/entities/group.entity';
import { Like } from './src/entities/like.entity';
import { Message } from './src/entities/message.entity';
import { User } from './src/entities/user.entity';
import { createConnection, getConnection } from 'typeorm';
import * as bcrypt from 'bcrypt';

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

export async function seedTestDatabase() {
  const connection = await getConnection();
  console.log('Database connection established for seeding');

  const userRepository = connection.getRepository(User);
  const groupRepository = connection.getRepository(Group);
  const eventRepository = connection.getRepository(AppEvent);
  const connectionRepository = connection.getRepository(Connection);
  const commentRepository = connection.getRepository(Comment);
  const likeRepository = connection.getRepository(Like);
  const notificationRepository = connection.getRepository(Notification);
  const messageRepository = connection.getRepository(Message);

  // Create dummy users
  const users = await userRepository.save([
    {
      username: 'Test User1',
      email: 'testUser1@test.com',
      password: await hashPassword('StrongPassword1#'),
      googleId: '',
      authMethod: 'email',
      backgroundImage: 'https://picsum.photos/800/600?random=1',
      profileImage: 'https://randomuser.me/api/portraits/men/1.jpg',
      bio: 'Enjoy watching bands, hiking and real ale',
      aboutMe:
        'Hi, I’m test user1! I’m passionate about connecting with people and exploring new experiences. Whether it’s attending community events, learning a new skill, or just enjoying a fun day out, I love being part of activities that bring people together. My interests include tech, sustainability, and trying out unique workshops.',
      tags: ['Live Music', 'Hiking Trails', 'Craft Beer'],
      viewEventsStatus: 'public',
      viewConnectionsStatus: 'public',
      viewGroupsStatus: 'public',
      viewTagsStatus: 'public',
      viewProfileImage: 'public',
      viewBioStatus: 'public',
      aboutMeStatus: 'public',
      role: 'user',
    },
    {
      username: 'Test User2',
      email: 'testUser2@test.com',
      password: await hashPassword('StrongPassword2#'),
      googleId: '',
      authMethod: 'email',
      profileBackgroundImage: 'https://picsum.photos/800/600?random=2',
      profileImage: 'https://randomuser.me/api/portraits/men/2.jpg',
      aboutMe:
        'Hi, I’m John! I’m passionate about connecting with people and exploring new experiences. Whether it’s attending community events, learning a new skill, or just enjoying a fun day out, I love being part of activities that bring people together. My interests include tech, sustainability, and trying out unique workshops.',
      bio: 'Love movies, music festivals and exploring new cultures',
      tags: ['Cultural Travel', 'Film Screenings', 'Outdoor Festivals'],
      viewEventsStatus: 'public',
      viewConnectionsStatus: 'public',
      viewGroupsStatus: 'public',
      viewTagsStatus: 'public',
      viewProfileImage: 'public',
      viewBioStatus: 'public',
      aboutMeStatus: 'public',
      role: 'user',
    },
    {
      username: 'Test User3',
      email: 'testUser3@test.com',
      password: await hashPassword('StrongPassword3#'),
      googleId: '',
      authMethod: 'email',
      profileBackgroundImage: 'https://picsum.photos/800/600?random=3',
      profileImage: 'https://randomuser.me/api/portraits/men/3.jpg',
      aboutMe:
        'Hi, I’m Freddie! I’m passionate about connecting with people and exploring new experiences. Whether it’s attending community events, learning a new skill, or just enjoying a fun day out, I love being part of activities that bring people together. My interests include tech, sustainability, and trying out unique workshops.',
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
    {
      username: 'Test User4',
      email: 'testUser4@test.com',
      password: await hashPassword('StrongPassword4#'),
      googleId: '',
      authMethod: 'email',
      profileBackgroundImage: 'https://picsum.photos/800/600?random=4',
      profileImage: 'https://randomuser.me/api/portraits/men/4.jpg',
      aboutMe:
        'Hi, I’m Michael! I’m passionate about connecting with people and exploring new experiences. Whether it’s attending community events, learning a new skill, or just enjoying a fun day out, I love being part of activities that bring people together. My interests include tech, sustainability, and trying out unique workshops.',
      bio: 'Tech enthusiast and nature lover',
      tags: ['Nature Photography', 'Mindfulness Retreats', 'Yoga Workshops'],
      viewEventsStatus: 'public',
      viewConnectionsStatus: 'public',
      viewGroupsStatus: 'public',
      viewTagsStatus: 'public',
      viewProfileImage: 'public',
      viewBioStatus: 'public',
      aboutMeStatus: 'public',
      role: 'user',
    },
  ]);

  // Create dummy groups
  const groups = await groupRepository.save([
    {
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
    },
    {
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
      approved: false,
    },
    {
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
    },
  ]);

  // Create dummy events
  const events = await eventRepository.save([
    {
      image:
        'https://cdn-az.allevents.in/events2/banners/5ba47d90-a3cb-11ef-a9ed-d71d5d988295-rimg-w1200-h685-dc222832-gmir.jpg',
      date: 1733356800000,
      startTime: '10:00 AM',
      title: 'Tech Talk: Future of AI',
      groupName: 'Tech Enthusiasts',
      group: groups[0],
      duration: '3 hrs',
      going: 2,
      capacity: 50,
      availability: 48,
      free: true,
      priceBands: [],
      approved: true,
      category: 'technology',
      tags: ['Technology', 'AI', 'Innovation', 'Future', 'Networking'],
      description: [
        'Join us for an in-depth exploration of Artificial Intelligence and its revolutionary impact on various industries!',
        "The event will feature expert speakers who will provide insights into the latest developments in AI technology and its potential to shape the future. From advancements in machine learning to AI-powered automation, we’ll cover how these innovations are transforming industries such as healthcare, finance, and transportation. Whether you're an AI enthusiast or new to the subject, you'll gain valuable knowledge and perspectives from professionals in the field.",
        'This is also a great opportunity for networking with like-minded individuals who are passionate about technology and its future. Engage in thought-provoking discussions, exchange ideas, and explore potential collaborations with fellow tech enthusiasts. We’ll be diving deep into the ethical implications of AI and how it will impact society, making this a must-attend for anyone interested in the future of technology.',
        'Don’t miss this chance to stay ahead of the curve, expand your understanding of AI, and connect with some of the brightest minds in the industry. Join us for a day filled with learning, discussion, and innovation that will leave you inspired and informed about the exciting possibilities of AI.',
      ],
      location: {
        placename: 'Weymouth Library',
        lng: -2.4512,
        lat: 50.6105,
      },
    },
    {
      image:
        'https://i2-prod.somersetlive.co.uk/incoming/article7010385.ece/ALTERNATES/s615/0_Weymouth.jpg',
      date: 1733472000000,
      startTime: '8:00 AM',
      title: 'Outdoor Adventure Meetup',
      group: groups[0],
      duration: '3 hrs',
      going: 2,
      capacity: 50,
      availability: 48,
      free: false,
      priceBands: [
        { type: 'Standard', price: '£50', ticketCount: 38 },
        { type: 'VIP', price: '£80', ticketCount: 10 },
      ],
      approved: true,
      category: 'outdoors',
      tags: ['Outdoor', 'Adventure', 'Hiking', 'Exploration', 'Nature'],
      description: [
        'Join us for a thrilling and adventurous hiking trip through the stunning landscapes of Weymouth and the surrounding areas!',
        "Adventure Seekers is a community of outdoor enthusiasts passionate about exploring Dorset's natural beauty. Whether you're an experienced hiker or a nature lover, this event is for you. We’ll embark on an unforgettable journey through rugged terrain, meeting like-minded adventurers along the way.",
        "The adventure begins at Weymouth Harbour, with breathtaking views of Chesil Beach. As we follow the coastal paths, enjoy views of the Jurassic Coastline, a UNESCO World Heritage site. Our knowledgeable guides will share insights into the area's geology, wildlife, and history.",
        'After our hike, we’ll take a break at a local pub in Portland Bill, reflecting on the adventure. Whether you’re looking to make new connections, appreciate nature, or simply enjoy an outdoor day, this hike offers a perfect opportunity for relaxation and new memories.',
      ],
      location: {
        placename: 'Weymouth Library',
        lng: -2.4512,
        lat: 50.6105,
      },
    },
    {
      image:
        'https://img.freepik.com/premium-photo/drawing-architectural-design-with-trees-green-building-style-transparent_921860-52616.jpg',
      date: 1733884800000,
      startTime: '9:00 AM',
      title: 'Sustainable Architecture Conference',
      group: groups[1],
      duration: '5 hrs',
      going: 2,
      capacity: 50,
      availability: 48,
      free: false,
      priceBands: [
        { type: 'Standard', price: '£50', ticketCount: 38 },
        { type: 'VIP', price: '£80', ticketCount: 10 },
      ],
      approved: true,
      category: 'arts',
      tags: [
        'Exhibitions',
        'Mixed Media',
        'Community',
        'Meet New Friends',
        'Learning',
        'Culture',
      ],
      description: [
        'Join us for a deep dive into sustainable architectural practices and the future of design!',
        'This conference brings together leading architects and industry experts who will share their latest sustainable design solutions. With climate change becoming an urgent global challenge, the field of architecture must evolve to create eco-friendly, energy-efficient buildings that minimize environmental impact. Attendees will learn about cutting-edge materials, green building certifications, and how technology is driving innovation in sustainable design.',
        'During the event, you’ll have the opportunity to explore real-world case studies of sustainable architecture projects, showcasing how eco-friendly designs are not only beneficial to the environment but also cost-effective in the long term. The discussions will include topics such as passive house standards, renewable energy integration, and the latest trends in circular architecture.',
        'The conference will also provide a platform for networking with professionals from various sectors within the construction industry, fostering collaborations that could lead to groundbreaking projects. Whether you’re a seasoned architect, a student, or someone passionate about sustainable living, this event will inspire and equip you with the knowledge to contribute to a greener future.',
      ],
      location: {
        placename: 'Weymouth Library',
        lng: -2.4512,
        lat: 50.6105,
      },
    },
    {
      image: 'https://kurieta.com/wp-content/uploads/2024/02/images-67.jpeg',
      date: 1733971200000,
      startTime: '2:00 PM',
      title: 'Digital Marketing Strategies',
      group: groups[1],
      duration: '4 hrs',
      going: 2,
      capacity: 50,
      availability: 48,
      free: false,
      priceBands: [
        { type: 'Early Bird', price: '£20', ticketCount: 8 },
        { type: 'Standard', price: '£50', ticketCount: 30 },
        { type: 'VIP', price: '£80', ticketCount: 10 },
      ],
      approved: true,
      category: 'business',
      tags: [
        'Networking',
        'Entrepreneurship',
        'Startups',
        'Small Businesses',
        'Freelancers',
        'Social Networking',
        'Consulting',
        'Public Speaking',
        'Business Strategy',
      ],
      description: [
        'Join us to master the latest digital marketing strategies and techniques!',
        'In this session, you will explore the latest trends in digital marketing, including search engine optimization (SEO), content marketing, social media strategies, and data analytics. Industry experts will demonstrate how to leverage these tools to build effective campaigns that generate results. Attendees will gain insights into current best practices and learn how to create strategies that align with business goals and target audiences.',
        "The event will feature hands-on workshops where you can try out the tools and techniques discussed, giving you practical experience in using advanced marketing platforms. Whether you're a business owner looking to enhance your online presence or a marketing professional aiming to stay ahead of the curve, this is the perfect opportunity to level up your skills.",
        'Moreover, the event will provide ample networking opportunities with marketing experts, business leaders, and like-minded professionals. By the end of the session, you’ll walk away with actionable insights that can directly improve your digital marketing efforts and help you stand out in an increasingly competitive online landscape.',
      ],
      location: {
        placename: 'Weymouth Library',
        lng: -2.4512,
        lat: 50.6105,
      },
    },
    {
      image:
        'https://media.istockphoto.com/id/923815474/photo/cooking-class.jpg?s=612x612&w=0&k=20&c=4lwiHGS2IDKRZsd1BVpV93YIpIAMTPpd7T34xjH-Bys=',
      date: 1734094800000,
      startTime: '11:00 AM',
      title: 'Healthy Cooking Workshop',
      group: groups[2],
      duration: '3 hrs',
      going: 2,
      capacity: 50,
      availability: 48,
      free: true,
      priceBands: [],
      approved: true,
      category: 'food & drink',
      tags: [
        'Cooking Classes',
        'Baking',
        'Farm-to-Table',
        'Culinary Arts',
        'Local Cuisine',
        'Community',
        'Social',
        'Meet New Friends',
        'Tasting Menus',
        'Vegetarian Cuisine',
      ],
      description: [
        'Join us for an exciting cooking workshop focused on healthy eating!',
        "This hands-on workshop, led by an experienced professional chef, will teach you how to create delicious and nutritious meals from scratch. You'll learn how to make healthy choices in your cooking, including the use of fresh, local ingredients, and how to incorporate more vegetables and lean proteins into your meals.",
        "Whether you're looking to improve your eating habits or learn new cooking techniques, this workshop is perfect for anyone interested in healthy living. We’ll cover meal prep ideas, cooking methods that preserve nutrients, and how to make cooking a fun and rewarding experience.",
        'All ingredients will be provided for the session, and you’ll get to take home your creations to enjoy. The focus is on fun, learning, and making healthy eating accessible for everyone, no matter your skill level in the kitchen.',
      ],
      location: {
        placename: 'Weymouth Library',
        lng: -2.4512,
        lat: 50.6105,
      },
    },
    {
      image:
        'https://bookretreats.com/assets/photo/retreat/0m/32k/32042/p_1341607/1000_1707746972.jpg',
      date: 1734181200000,
      startTime: '8:00 AM',
      title: 'Yoga Retreat in the Countryside',
      group: groups[2],
      duration: '12 hrs',
      going: 2,
      capacity: 50,
      availability: 48,
      free: true,
      priceBands: [],
      approved: true,
      category: 'health',
      tags: [
        'Wellness',
        'Meditation',
        'Nutrition',
        'Fitness Retreats',
        'Workshops',
        'Mindfulness',
        'Health Talks',
        'Social',
        'Meet New Friends',
        'Relationship Building',
        'Herbal Remedies',
        'Wellness Walks',
        'Preventative Health',
        'Self-Improvement',
      ],
      description: [
        'Escape to the peaceful countryside for a rejuvenating yoga retreat!',
        "Join us for a weekend of mindfulness, relaxation, and wellness in a serene natural setting. This retreat is designed to help you refresh both your body and mind through yoga, meditation, and nature walks. The retreat is suitable for all levels, whether you're new to yoga or a seasoned practitioner.",
        "Over the weekend, you'll enjoy daily yoga classes, mindfulness practices, and plenty of free time to unwind and reconnect with yourself. Experience the tranquility of the countryside and enjoy healthy, nourishing meals prepared by expert chefs.",
        'The retreat is all about slowing down, tuning into your body, and finding inner peace. You’ll leave feeling refreshed, recharged, and with practical tools to bring mindfulness into your everyday life.',
      ],
      location: {
        placename: 'Weymouth Library',
        lng: -2.4512,
        lat: 50.6105,
      },
    },
  ]);

  // Create dummy connections between users
  await connectionRepository.save([
    { requester: users[0], recipient: users[1], status: 'accepted' },
    { requester: users[1], recipient: users[2], status: 'pending' },
  ]);

  // Create dummy comments
  const comments = await commentRepository.save([
    { content: 'Great event!', user: users[0], eventId: events[0].id },
    {
      content: 'Looking forward to this!',
      user: users[1],
      eventId: events[1].id,
    },
  ]);

  // Create dummy likes
  await likeRepository.save([
    { user: users[0], comment: comments[0] },
    { user: users[1], comment: comments[1] },
  ]);

  // Create dummy notifications
  //   await notificationRepository.save([
  //     {
  //       user: users[0],
  //       senderId: users[1].id,
  //       type: 'connection_request',
  //       message: 'User 2 has connected with you',
  //       isRead: false,
  //     },
  //     // {
  //     //   user: users[1],
  //     //   senderId: users[2].id,
  //     //   type: 'event',
  //     //   message: 'Event 2 is starting soon',
  //     //   isRead: false,
  //     // },
  //   ]);

  // Create dummy messages
  await messageRepository.save([
    { sender: users[0], recipient: users[1], content: 'Hey, how are you?' },
    { sender: users[1], recipient: users[0], content: 'I am good, thanks!' },
  ]);

  console.log('Database seeded successfully!');
  await connection.close();
}

seedTestDatabase().catch((error) => {
  console.error('Error seeding database:', error);
});

export async function clearTestDatabase() {
  const connection = getConnection(); // Ensure this retrieves a valid connection
  await connection.getRepository(User).clear();
  await connection.getRepository(Group).clear();
  await connection.getRepository(AppEvent).clear();
  await connection.getRepository(Connection).clear();

  console.log('Test database cleared!');
}
