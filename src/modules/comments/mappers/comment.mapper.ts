import { CommentDataDto, SingleCommentResponseDto } from '../dto/comment-response.dto';
import { Comment } from '../entities/comment.entity';

export function toCommentData(
  comment: Comment,
  followingAuthorIds: Set<string>,
): CommentDataDto {
  return {
    id: comment.id,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    body: comment.body,
    author: {
      username: comment.author.username,
      bio: comment.author.bio,
      image: comment.author.image,
      following: followingAuthorIds.has(comment.authorId),
    },
  };
}

export function toSingleCommentResponse(
  comment: Comment,
  followingAuthorIds: Set<string>,
): SingleCommentResponseDto {
  return {
    comment: toCommentData(comment, followingAuthorIds),
  };
}
