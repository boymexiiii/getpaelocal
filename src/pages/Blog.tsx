import { ArrowLeft, Calendar, User, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Blog = () => {
  const navigate = useNavigate();

  const blogPosts = [
    {
      title: "Understanding Nigeria's New CBN Guidelines for Digital Payments",
      excerpt: "A comprehensive guide to the latest Central Bank of Nigeria regulations affecting digital payment platforms and what they mean for users.",
      author: "Kemi Adebayo",
      date: "December 18, 2024",
      category: "Regulation",
      readTime: "5 min read",
      featured: true
    },
    {
      title: "How to Maximize Your Crypto Investment Returns in 2025",
      excerpt: "Expert strategies for Nigerian investors looking to build wealth through cryptocurrency investments while managing risk effectively.",
      author: "Chima Okafor", 
      date: "December 15, 2024",
      category: "Investment",
      readTime: "7 min read",
      featured: false
    },
    {
      title: "The Future of Digital Banking in Nigeria",
      excerpt: "Exploring how digital-first financial services are transforming the banking landscape and empowering millions of Nigerians.",
      author: "Sarah Ogundimu",
      date: "December 12, 2024", 
      category: "Industry",
      readTime: "6 min read",
      featured: false
    },
    {
      title: "5 Essential Money Management Tips for Young Professionals",
      excerpt: "Practical advice for Nigerian graduates and young professionals to build financial stability and start investing for the future.",
      author: "Michael Adebayo",
      date: "December 10, 2024",
      category: "Personal Finance", 
      readTime: "4 min read",
      featured: false
    },
    {
      title: "Security Best Practices for Digital Wallet Users",
      excerpt: "Essential security tips to protect your digital wallet and financial information from fraud and cyber threats.",
      author: "Adebayo Johnson",
      date: "December 8, 2024",
      category: "Security",
      readTime: "5 min read", 
      featured: false
    }
  ];

  const categories = ["All", "Investment", "Security", "Regulation", "Industry", "Personal Finance"];

  const getCategoryColor = (category: string) => {
    const colors = {
      "Investment": "bg-green-100 text-green-800",
      "Security": "bg-red-100 text-red-800", 
      "Regulation": "bg-blue-100 text-blue-800",
      "Industry": "bg-purple-100 text-purple-800",
      "Personal Finance": "bg-orange-100 text-orange-800"
    };
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-teal-50 p-4">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Pae Blog</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Insights, updates, and expert advice on digital finance, investing, and 
            building financial wellness in Nigeria.
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <Button
                key={category}
                variant={category === "All" ? "default" : "outline"}
                size="sm"
                className={category === "All" ? "bg-gradient-to-r from-purple-600 to-teal-600" : ""}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Featured Post */}
        {blogPosts.find(post => post.featured) && (
          <Card className="mb-12 overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/3 bg-gradient-to-br from-purple-600 to-teal-600"></div>
              <div className="md:w-2/3 p-6">
                <Badge className={getCategoryColor(blogPosts[0].category)} variant="secondary">
                  Featured
                </Badge>
                <CardTitle className="text-2xl mt-3 mb-3">{blogPosts[0].title}</CardTitle>
                <p className="text-gray-600 mb-4">{blogPosts[0].excerpt}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {blogPosts[0].author}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {blogPosts[0].date}
                    </div>
                    <span>{blogPosts[0].readTime}</span>
                  </div>
                  <Button className="bg-gradient-to-r from-purple-600 to-teal-600">
                    Read More
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Blog Posts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {blogPosts.slice(1).map((post, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <div className="h-48 bg-gradient-to-br from-purple-600 to-teal-600"></div>
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge className={getCategoryColor(post.category)} variant="secondary">
                    {post.category}
                  </Badge>
                  <span className="text-xs text-gray-500">{post.readTime}</span>
                </div>
                <CardTitle className="text-lg line-clamp-2">{post.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{post.excerpt}</p>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    <div className="flex items-center gap-1 mb-1">
                      <User className="h-3 w-3" />
                      {post.author}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {post.date}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Read More
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Newsletter Signup */}
        <Card className="text-center">
          <CardHeader>
            <CardTitle>Stay Updated</CardTitle>
            <p className="text-gray-600">
              Subscribe to our newsletter for the latest insights on digital finance and investing in Nigeria.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex max-w-md mx-auto gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <Button className="bg-gradient-to-r from-purple-600 to-teal-600">
                Subscribe
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Blog;