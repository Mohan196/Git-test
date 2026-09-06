public class Loops {
    public static void main(String[] args) {
        // for loop: best when you know how many times to repeat
        System.out.println("Counting to 5:");
        for (int i = 1; i <= 5; i++) {
            System.out.println(i);
        }

        // while loop: repeats while a condition holds
        System.out.println("Countdown:");
        int count = 3;
        while (count > 0) {
            System.out.println(count);
            count--;
        }

        // do-while: runs the body at least once
        int n = 0;
        do {
            System.out.println("This runs at least once, n=" + n);
            n++;
        } while (n < 0);

        // for-each: iterate over a collection/array directly
        String[] fruits = {"apple", "banana", "cherry"};
        for (String fruit : fruits) {
            System.out.println("Fruit: " + fruit);
        }
    }
}
