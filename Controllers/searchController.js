import Blog from "../models/Blog.js";
import Article from "../models/Article.js";
import ForumThread from "../models/ForumThread.js";

export const searchAll = async (req, res) => {
  try {
    let { q, limit = 20, skip = 0, type } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({ error: "Search query (q) is required" });
    }

    q = q.trim();
    const limitNum = Math.min(Math.max(Number(limit), 1), 100); // cap at 100
    const skipNum = Math.max(Number(skip), 0);

    const modelMap = {
      article: Article,
      blog: Blog,
      forum: ForumThread,
    };

    // Handle "all" type or undefined: search all models
    const searchTypes = type === "all" || !type ? Object.keys(modelMap) : [type];

    // Validate types
    for (let t of searchTypes) {
      if (!modelMap[t]) {
        return res.status(400).json({ error: `Invalid type: ${t}` });
      }
    }

    const runSearch = async (model, type) => {
      try {
        // First try MongoDB text search
        const projection = { score: { $meta: "textScore" } };
        let results = await model
          .find({ $text: { $search: q } }, projection)
          .sort({ score: { $meta: "textScore" } });

        // Fallback to regex if no results
        if (!results || results.length === 0) {
          const regexQuery = {
            $or: [
              { title: { $regex: q, $options: "i" } },
              { content: { $regex: q, $options: "i" } },
              { summary: { $regex: q, $options: "i" } },
              { tags: { $regex: q, $options: "i" } },
            ],
          };
          results = await model.find(regexQuery);
        }

        return results.map((r) => ({
          ...r.toObject(),
          _type: type,
          _score: r.score || 0,
        }));
      } catch (err) {
        console.error(`Search failed for type ${type}:`, err);
        return [];
      }
    };

    // Run all searches concurrently
    const results = await Promise.all(
      searchTypes.map((t) => runSearch(modelMap[t], t))
    );

    // Flatten and sort globally
    let allResults = results.flat();
    allResults.sort((a, b) => {
      if (b._score !== a._score) return b._score - a._score;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    // Apply global pagination
    const paginatedResults = allResults.slice(skipNum, skipNum + limitNum);

    res.json({
      query: q,
      type: type || "all",
      skip: skipNum,
      limit: limitNum,
      totalCount: allResults.length,
      results: paginatedResults,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
