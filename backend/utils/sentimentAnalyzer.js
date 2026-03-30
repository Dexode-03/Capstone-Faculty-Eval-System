const Sentiment = require('sentiment');
const sentiment = new Sentiment();

/**
 * Analyze the sentiment of a text comment.
 * Returns sentiment label and numeric score.
 */
const analyzeSentiment = (text) => {
  const result = sentiment.analyze(text);

  let label;
  if (result.score > 0) {
    label = 'positive';
  } else if (result.score < 0) {
    label = 'negative';
  } else {
    label = 'neutral';
  }

  return {
    score: result.score,
    comparative: result.comparative,
    label,
    positive: result.positive,
    negative: result.negative,
  };
};

/**
 * Generate prescriptive recommendations based on evaluation data.
 * Analyzes patterns in feedback to suggest improvements.
 */
const generateRecommendations = (evaluations) => {
  const recommendations = [];

  if (!evaluations || evaluations.length === 0) {
    return ['No evaluations available for analysis.'];
  }

  // Calculate average rating
  const avgRating = evaluations.reduce((sum, e) => sum + e.rating, 0) / evaluations.length;

  // Count sentiments
  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
  evaluations.forEach((e) => {
    sentimentCounts[e.sentiment]++;
  });

  const totalEvals = evaluations.length;
  const negativePercent = (sentimentCounts.negative / totalEvals) * 100;
  const positivePercent = (sentimentCounts.positive / totalEvals) * 100;

  // Rating-based recommendations
  if (avgRating < 2.5) {
    recommendations.push('Overall rating is below average. Consider reviewing teaching methodology and student engagement strategies.');
  } else if (avgRating < 3.5) {
    recommendations.push('Rating is moderate. Focus on areas highlighted in negative feedback for improvement.');
  } else {
    recommendations.push('Excellent overall rating. Continue current teaching practices and share best practices with peers.');
  }

  // Sentiment-based recommendations
  if (negativePercent > 40) {
    recommendations.push('High percentage of negative feedback detected. Recommend scheduling a faculty development session.');
  }

  if (positivePercent > 70) {
    recommendations.push('Strong positive feedback trend. Consider this faculty for mentoring roles or teaching excellence awards.');
  }

  // Keyword-based analysis from comments
  const allComments = evaluations.map((e) => e.comment.toLowerCase()).join(' ');

  if (allComments.includes('fast') || allComments.includes('rushed') || allComments.includes('too quick')) {
    recommendations.push('Multiple comments mention pacing issues. Recommend slowing down lecture pace and allowing more time for questions.');
  }

  if (allComments.includes('unclear') || allComments.includes('confusing') || allComments.includes('hard to understand')) {
    recommendations.push('Clarity concerns detected. Consider using more examples and visual aids in lectures.');
  }

  if (allComments.includes('boring') || allComments.includes('monotone') || allComments.includes('unengaging')) {
    recommendations.push('Engagement issues noted. Recommend incorporating interactive activities and varied teaching methods.');
  }

  if (allComments.includes('helpful') || allComments.includes('approachable') || allComments.includes('supportive')) {
    recommendations.push('Students appreciate the supportive teaching style. Maintain this approachable demeanor.');
  }

  return recommendations;
};

module.exports = { analyzeSentiment, generateRecommendations };
