using CamnLib.DbModels;

namespace CamnLib
{

  public class InMemoryLog
  {
    private readonly System.Collections.Concurrent.ConcurrentQueue<UserAction> queue = new System.Collections.Concurrent.ConcurrentQueue<UserAction>();

    public void Log(UserAction action)
    {
      queue.Enqueue(action);
    }

    public bool IsEmpty()
    {
      return queue.IsEmpty;
    }

    public UserAction Get()
    {
      if (queue.TryDequeue(out UserAction a))
      {
        return a;
      }
      return null;
    }
  }
}
